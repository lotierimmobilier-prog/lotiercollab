import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sendEmailNotification } from '../lib/emailNotify';
import type { MessageConversation, Message, Member, MessagingTeam } from '../types';

export function useConversations(memberId: string | null, isSuperAdmin = false) {
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!memberId && !isSuperAdmin) { setLoading(false); return; }
    setLoading(true);

    let convs: { id: string; title: string; created_by: string | null; created_at: string; updated_at: string }[] | null = null;

    if (isSuperAdmin) {
      const { data } = await supabase
        .from('message_conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      convs = data;
    } else {
      const { data: memberConvs } = await supabase
        .from('message_conversation_members')
        .select('conversation_id')
        .eq('member_id', memberId);

      const convIds = (memberConvs ?? []).map((r: { conversation_id: string }) => r.conversation_id);

      if (convIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('message_conversations')
        .select('*')
        .in('id', convIds)
        .order('updated_at', { ascending: false });
      convs = data;
    }

    if (!convs) { setLoading(false); return; }

    const enriched = await Promise.all(convs.map(async (conv) => {
      const { data: membersData } = await supabase
        .from('message_conversation_members')
        .select('member_id')
        .eq('conversation_id', conv.id);

      const memberIds = (membersData ?? []).map((r: { member_id: string }) => r.member_id);

      let members: Member[] = [];
      if (memberIds.length > 0) {
        const { data: membersRows } = await supabase
          .from('members')
          .select('*')
          .in('id', memberIds);
        members = membersRows ?? [];
      }

      const { data: lastMsgData } = await supabase
        .from('chat_messages')
        .select('id, body, created_at, author_id')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return { ...conv, members, last_message: lastMsgData ?? undefined };
    }));

    setConversations(enriched as MessageConversation[]);
    setLoading(false);
  }, [memberId, isSuperAdmin]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const channelName = `convs-${memberId ?? 'admin'}`;
    if (!memberId && !isSuperAdmin) return;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_conversations' }, () => { fetch(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_conversation_members' }, () => { fetch(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => { fetch(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [memberId, fetch]);

  const createConversation = async (title: string, memberIds: string[], authorMemberId: string) => {
    const { data: conv, error } = await supabase
      .from('message_conversations')
      .insert({ title, created_by: authorMemberId })
      .select()
      .single();

    if (error || !conv) return { data: null, error };

    const allMemberIds = Array.from(new Set([authorMemberId, ...memberIds]));
    await supabase
      .from('message_conversation_members')
      .insert(allMemberIds.map(mid => ({ conversation_id: conv.id, member_id: mid })));

    await fetch();
    return { data: conv, error: null };
  };

  const deleteConversation = async (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    await supabase.from('message_conversations').delete().eq('id', id);
  };

  return { conversations, loading, refetch: fetch, createConversation, deleteConversation };
}

const messageCache = new Map<string, Message[]>();

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>(() =>
    conversationId ? (messageCache.get(conversationId) ?? []) : []
  );
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!conversationId) { setMessages([]); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, author:members!chat_messages_author_id_fkey(*), reply_to:chat_messages!chat_messages_reply_to_id_fkey(*, author:members!chat_messages_author_id_fkey(*)), attachments:chat_attachments!chat_attachments_message_id_fkey(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) console.error('fetch messages error', error);
    if (data) {
      const typed = data as unknown as Message[];
      messageCache.set(conversationId, typed);
      setMessages(typed);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    const cached = conversationId ? messageCache.get(conversationId) : null;
    if (cached) {
      setMessages(cached);
    } else {
      setMessages([]);
    }
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!conversationId) return;
    const channelName = `chat-${conversationId}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, () => { fetch(); })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_attachments',
      }, () => { fetch(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, fetch]);

  const uploadAttachment = async (file: File, messageId: string, memberId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${memberId}/${messageId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('message-attachments')
      .upload(path, file, { contentType: file.type });
    if (error) return null;
    const { data } = supabase.storage.from('message-attachments').getPublicUrl(path);
    return data.publicUrl;
  };

  const sendMessage = async (params: {
    body: string;
    authorId: string;
    replyToId?: string | null;
    citedTaskId?: string | null;
    citedTaskTitle?: string | null;
    files?: File[];
    overrideConversationId?: string;
  }) => {
    const targetConvId = params.overrideConversationId ?? conversationId;
    if (!targetConvId) return;
    const { body, authorId, replyToId, citedTaskId, citedTaskTitle, files } = params;

    const { data: msg, error } = await supabase.from('chat_messages').insert({
      conversation_id: targetConvId,
      author_id: authorId,
      body,
      reply_to_id: replyToId ?? null,
      cited_task_id: citedTaskId ?? null,
      cited_task_title: citedTaskTitle ?? null,
    }).select().single();

    if (error || !msg) { console.error('sendMessage error', error); return; }

    setMessages(prev => {
      const next = [...prev, { ...msg, author: null, reply_to: null, attachments: [] } as unknown as Message];
      if (targetConvId) messageCache.set(targetConvId, next);
      return next;
    });

    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadAttachment(file, msg.id, authorId);
        if (url) {
          await supabase.from('chat_attachments').insert({
            message_id: msg.id,
            file_name: file.name,
            file_url: url,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: authorId,
          });
        }
      }
    }

    await supabase
      .from('message_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', targetConvId);

    // Notify all other members of the conversation by email (fire-and-forget)
    (() => {
      const preview = body.length > 140 ? body.slice(0, 140) + '…' : body;
      Promise.all([
        supabase
          .from('message_conversation_members')
          .select('member_id')
          .eq('conversation_id', targetConvId),
        supabase
          .from('message_conversations')
          .select('title')
          .eq('id', targetConvId)
          .maybeSingle(),
        supabase
          .from('members')
          .select('id, full_name')
          .eq('id', authorId)
          .maybeSingle(),
      ]).then(([{ data: memberRows }, { data: convRow }, { data: authorRow }]) => {
        const convTitle = convRow?.title ?? 'Conversation';
        const actorName = authorRow?.full_name ?? '';
        for (const row of memberRows ?? []) {
          if (row.member_id === authorId) continue;
          sendEmailNotification({
            event_type: 'new_message',
            recipient_member_id: row.member_id,
            vars: {
              actor_name: actorName,
              conversation_title: convTitle,
              message_preview: preview,
              unread_count: '1',
            },
          });
        }
      });
    })();

    await fetch();
  };

  const editMessage = async (messageId: string, body: string) => {
    setMessages(prev => {
      const next = prev.map(m => m.id === messageId ? { ...m, body, edited_at: new Date().toISOString() } : m);
      if (conversationId) messageCache.set(conversationId, next);
      return next;
    });
    await supabase.from('chat_messages').update({ body, edited_at: new Date().toISOString() }).eq('id', messageId);
  };

  const deleteMessage = async (messageId: string) => {
    const deletedAt = new Date().toISOString();
    setMessages(prev => {
      const next = prev.map(m => m.id === messageId ? { ...m, deleted_at: deletedAt } : m);
      if (conversationId) messageCache.set(conversationId, next);
      return next;
    });
    await supabase.from('chat_messages').update({ deleted_at: deletedAt }).eq('id', messageId);
  };

  return { messages, loading, refetch: fetch, sendMessage, editMessage, deleteMessage };
}

export function useMessagingContacts(memberId: string | null) {
  const [allowedContacts, setAllowedContacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!memberId) { setLoading(false); return; }
    const { data } = await supabase
      .from('member_messaging_contacts')
      .select('contact_id')
      .eq('member_id', memberId);
    setAllowedContacts((data ?? []).map((r: { contact_id: string }) => r.contact_id));
    setLoading(false);
  }, [memberId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { allowedContacts, loading, refetch: fetch };
}

export function useMessagingTeams() {
  const [teams, setTeams] = useState<MessagingTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: teamsData } = await supabase
      .from('messaging_teams')
      .select('*')
      .order('name');

    if (!teamsData) { setLoading(false); return; }

    const enriched = await Promise.all(teamsData.map(async (team) => {
      const { data: membersData } = await supabase
        .from('messaging_team_members')
        .select('member_id')
        .eq('team_id', team.id);

      const memberIds = (membersData ?? []).map((r: { member_id: string }) => r.member_id);
      let members: Member[] = [];
      if (memberIds.length > 0) {
        const { data: membersRows } = await supabase.from('members').select('*').in('id', memberIds);
        members = membersRows ?? [];
      }
      return { ...team, members };
    }));

    setTeams(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createTeam = async (name: string, memberIds: string[]) => {
    const { data: team, error } = await supabase
      .from('messaging_teams')
      .insert({ name })
      .select()
      .single();
    if (error || !team) return;
    if (memberIds.length > 0) {
      await supabase.from('messaging_team_members').insert(
        memberIds.map(mid => ({ team_id: team.id, member_id: mid }))
      );
    }
    await fetch();
  };

  const updateTeamMembers = async (teamId: string, memberIds: string[]) => {
    await supabase.from('messaging_team_members').delete().eq('team_id', teamId);
    if (memberIds.length > 0) {
      await supabase.from('messaging_team_members').insert(
        memberIds.map(mid => ({ team_id: teamId, member_id: mid }))
      );
    }
    await fetch();
  };

  const deleteTeam = async (teamId: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
    await supabase.from('messaging_teams').delete().eq('id', teamId);
  };

  const updateMemberContacts = async (memberId: string, contactIds: string[]) => {
    await supabase.from('member_messaging_contacts').delete().eq('member_id', memberId);
    if (contactIds.length > 0) {
      await supabase.from('member_messaging_contacts').insert(
        contactIds.map(cid => ({ member_id: memberId, contact_id: cid }))
      );
    }
  };

  const getMemberContacts = async (memberId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('member_messaging_contacts')
      .select('contact_id')
      .eq('member_id', memberId);
    return (data ?? []).map((r: { contact_id: string }) => r.contact_id);
  };

  return { teams, loading, refetch: fetch, createTeam, updateTeamMembers, deleteTeam, updateMemberContacts, getMemberContacts };
}
