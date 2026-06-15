/*
  # Add unique constraint on google_event_id in calendar_events

  Required for upsert (onConflict: "google_event_id") to work correctly
  when importing events from Google Calendar.
*/

ALTER TABLE calendar_events
  ADD CONSTRAINT calendar_events_google_event_id_key UNIQUE (google_event_id);
