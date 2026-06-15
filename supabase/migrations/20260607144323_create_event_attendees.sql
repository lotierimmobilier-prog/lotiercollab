CREATE TABLE event_attendees (
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, member_id)
);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_event_attendees" ON event_attendees FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_event_attendees" ON event_attendees FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "delete_event_attendees" ON event_attendees FOR DELETE
  TO authenticated USING (true);

CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_member_id ON event_attendees(member_id);
