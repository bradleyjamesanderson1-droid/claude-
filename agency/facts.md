# Agency facts: fill this in before the first outreach run
The outreach agents only state what's written here. Blank fields stop the nightly run.

## Switches
outreach_paused: false
daily_cap: 20                 # new first-touch + follow-up drafts per night
compliance_rule:              # REQUIRED, your rule under POPIA s69 / other laws, e.g.
                              # "single request-for-interest email; opt-out line on every email; no personal addresses"
optout_line:                  # e.g. "Not relevant? Reply 'no' and I won't email again."

## Free-site play (local businesses without a website)
free_site_play: false
free_site_categories:         # e.g. "plumbers, panel beaters"
free_site_areas:              # e.g. "Centurion, Pretoria East"
free_sites_per_night: 5

## Sender
sender_name:
sender_title:
signature: |
  <name>
  <agency name> · <phone>
reply_language: South African English

## Offer (never quoted with a price in email)
agency_name:
one_liner:                    # from /position-offer, e.g. "We help litigation firms answer every new enquiry within 5 minutes."
service: lead-response        # lead-response | outbound-research | support-triage
proof_points:                 # true, checkable facts only (demo results labelled as demo)
  -

## Who to contact (ICP)
sectors:                      # e.g. "Personal injury & RAF litigation firms"
regions:                      # e.g. "Gauteng, Western Cape"
company_size:                 # e.g. "5-50 fee earners"
roles:                        # e.g. "Managing partner, practice manager"
exclude:                      # existing clients, competitors, anyone you know personally
  -

## Calls
call_hours: "09:00-16:00"
time_zone: Africa/Johannesburg
call_length_minutes: 15
booking_link:                 # optional, e.g. Cal.com
calendar_email:               # the Google Calendar to check for free slots

## Notion
pipeline_database_url:        # set during setup

## Do not contact (emails or domains, in addition to Notion status)
-
