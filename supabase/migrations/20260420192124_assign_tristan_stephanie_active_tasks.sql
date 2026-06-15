
/*
  # Assign Tristan and Stéphanie to all active tasks

  Assigns Tristan Terpereau (de3a70be-62c0-4adb-b981-ea805d01bc6a)
  and Stéphanie LEGROS (ece3e4fc-1260-4fe5-8638-f4a6ecd692e5)
  to all tasks that are not yet completed (status != 'done').

  - Updates assigned_to (primary assignee) to Tristan on tasks with no assignee
  - Inserts both members into task_assignees junction table
  - Uses ON CONFLICT DO NOTHING to avoid duplicates
*/

-- Set Tristan as primary assignee on tasks that have none
UPDATE tasks
SET assigned_to = 'de3a70be-62c0-4adb-b981-ea805d01bc6a'
WHERE status != 'done'
  AND assigned_to IS NULL;

-- Assign Tristan to all active tasks in the junction table
INSERT INTO task_assignees (task_id, member_id)
SELECT id, 'de3a70be-62c0-4adb-b981-ea805d01bc6a'
FROM tasks
WHERE status != 'done'
ON CONFLICT DO NOTHING;

-- Assign Stéphanie to all active tasks in the junction table
INSERT INTO task_assignees (task_id, member_id)
SELECT id, 'ece3e4fc-1260-4fe5-8638-f4a6ecd692e5'
FROM tasks
WHERE status != 'done'
ON CONFLICT DO NOTHING;
