import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = { title: "User guide" };

// Staff handbook for the admin portal, plus the one-time setup of reminders,
// Google Calendar, SMS, social media and going live. Plain text on purpose:
// it is read by staff, not developers, except the marked "Setup" parts.

type Section = {
  id: string;
  title: string;
  group: "Daily work" | "Catalogue & website" | "Setup";
  intro: string;
  steps?: ReactNode[];
  tips?: ReactNode[];
  extra?: ReactNode;
};

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-navy-950 p-4 text-[13px] leading-6 text-gold-100">
      <code>{children}</code>
    </pre>
  );
}

function Note({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  return (
    <p
      className={`mt-4 rounded-xl px-4 py-3 text-sm ${
        tone == "warn" ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-sky-50 text-sky-900 ring-1 ring-sky-200"
      }`}
    >
      {children}
    </p>
  );
}

const ENV_FILE = "gazellkey-client/gazellkey-international/.env";

const SECTIONS: Section[] = [
  // ─────────────── Daily work ───────────────
  {
    id: "sign-in",
    group: "Daily work",
    title: "Signing in and finding your way",
    intro: "The admin portal is for Gazellekey staff only. Customers use the website.",
    steps: [
      <>Open the admin portal and sign in with your work email and password. Click the <b>eye</b> button to see the password you typed.</>,
      <>Tick <b>Remember me for 30 days</b> on your own computer to stay signed in. Leave it empty on shared computers - you are signed out when the browser closes.</>,
      <>When the browser asks <b>Save password?</b>, click Save. Next time it fills in your email and password for you.</>,
      <>The <b>menu on the left</b> shows only what your role may use. Your name and role are at the top right, with <b>Sign out</b>.</>,
      <>Numbers on the menu (e.g. on <b>Orders &amp; bookings</b> or <b>Document approvals</b>) show how many items are waiting for you.</>,
    ],
    tips: [
      <>Forgot your password? Ask your administrator - a password can only be chosen when the account is created, so for now an admin has to help you get back in.</>,
      <>This guide is always one click away: <b>User guide</b> in the menu or at the top right.</>,
    ],
  },
  {
    id: "dashboard",
    group: "Daily work",
    title: "Dashboard",
    intro: "Start your day here: what needs attention across the six divisions.",
    steps: [
      <><b>Open by division</b> shows how many enquiries are still open in each division. Click a division to see its list.</>,
      <><b>Recent enquiries</b> shows the newest ones. Click one to work on it.</>,
      <><b>Quick add</b> opens the forms you use most (customer, tour, product ...).</>,
    ],
  },
  {
    id: "enquiries",
    group: "Daily work",
    title: "Enquiries",
    intro: "Every question from the website, and enquiries staff add for walk-ins and phone calls.",
    steps: [
      <>Open <Link href="/enquiries">Enquiries</Link>. The newest are at the top. Use the search box (reference, subject or customer email) and the filters (division, status, priority). <b>New</b> ones still need a reply.</>,
      <>Read the customer's name, subject, division and who it is assigned to, then reply to the customer by <b>email or phone</b>.</>,
      <>Open the customer under <Link href="/customers">Customers</Link> to see their details and other requests.</>,
    ],
    tips: [
      <>Changing an enquiry's status, assigning it and creating quotations are not in the admin screens yet - the system supports them, and buttons for them are the next step to build.</>,
      <>New enquiries also send an <b>SMS to the office phone</b> and a red <b>“Reply to enquiry”</b> reminder to Google Calendar - once those are set up (see <a href="#sms">SMS reminders</a> and <a href="#google-calendar">Google Calendar</a>).</>,
    ],
  },
  {
    id: "appointments",
    group: "Daily work",
    title: "Appointments",
    intro: "Customers book office visits, phone calls and video calls on the website. Staff confirm them here.",
    steps: [
      <>Customers book on the website under <b>Book appointment</b>: they pick a division, a type (office visit, phone or video call) and a free time. Booking hours are <b>Monday to Saturday, 09:00 - 17:00 Sri Lanka time, in 30-minute slots</b>. Each division has its own slots.</>,
      <>A new booking arrives as <b>Requested</b>. You get an SMS and a yellow <b>“To confirm”</b> event in Google Calendar (once set up).</>,
      <>Open <Link href="/appointments">Appointments</Link> and click the booking. Under <b>Staff, place and notes</b> choose the staff member, the office address or the video link, and add internal notes (customers never see them).</>,
      <>Click <b>Confirm appointment</b>. The customer is emailed, and the calendar event turns <b>green</b> with reminders 1 day, 1 hour and 15 minutes before.</>,
      <>Need another time? Use <b>Reschedule</b>. Afterwards mark it <b>Mark completed</b> or <b>No-show</b>, or cancel it with a reason the customer will see.</>,
    ],
    tips: [
      <>Holidays and staff leave: add them as events in the office Google Calendar. The website then does not offer those times.</>,
      <>The <b>Google Calendar</b> box on the booking shows whether it is in the calendar, with a link to open it.</>,
    ],
  },
  {
    id: "rentals",
    group: "Daily work",
    title: "Rentals (huts, chairs, tables ...)",
    intro: "Customers hire event equipment for weddings, funerals and parties on the website's Rentals page. The Events team confirms each request.",
    steps: [
      <>On the website, customers choose their <b>dates</b>, see what is <b>free on those days</b>, pick items and quantities, and send a request with the venue and whether they need delivery and setup. Nothing is paid online.</>,
      <>New requests appear under <Link href="/rentals">Rental bookings</Link> as <b>Requested</b> (with a number on the menu), and the office phone gets an SMS once SMS is set up.</>,
      <>Open the booking and call the customer. Enter the <b>Final price</b> (items plus delivery and setup) and any <b>internal notes</b>, then click <b>Save price and notes</b>.</>,
      <>Click <b>Confirm booking</b>. The system checks every day of the booking and <b>holds the stock</b>, so the same chairs can never be promised twice. The customer gets a confirmation email with the total.</>,
      <>On the day, click <b>Mark delivered</b>. When everything is back (check for damage), click <b>Mark returned</b> - the items are free again. You can <b>Cancel</b> with a reason before delivery.</>,
    ],
    tips: [
      <>The <b>Free</b> column on a booking shows how many of each item are left on those dates. Red means there is not enough - offer other dates or fewer items.</>,
      <>Add or change items under <Link href="/catalogue/rentals">Rental items</Link>: price per day, <b>how many you own</b>, minimum per booking and photos. A request does not hold stock - only a confirmed booking does.</>,
    ],
  },
  {
    id: "fertilizer",
    group: "Daily work",
    title: "Fertilizer (sold online)",
    intro: "Fertilizer is a shop product in the category Fertilizer. It shows on the website&apos;s Fertilizer page (in the top menu) and in the Shop, where anyone with an account can buy it online.",
    steps: [
      <>Open <Link href="/catalogue/shop?search=Fertilizer">Catalogue → Fertilizer</Link> and click the product to change the <b>price</b> (now LKR 150), the <b>unit</b> (kg), the <b>stock</b> (how many kg you have), the description and the <b>photos</b>.</>,
      <>To sell another fertilizer (another type or bag size), click <b>Add</b> in Shop products and choose the category <b>Fertilizer</b> - it appears on the Fertilizer page by itself.</>,
      <>Online orders arrive under <Link href="/orders">Orders &amp; bookings</Link> like every shop order; bulk and dealer requests arrive as <Link href="/enquiries">Enquiries</Link> (Import division).</>,
    ],
    tips: [<>Keep the stock up to date - when it reaches 0 the website shows the fertilizer as sold out.</>],
  },
  {
    id: "work-visa",
    group: "Daily work",
    title: "Work visa (overseas jobs)",
    intro: "You add overseas jobs in the admin; they appear on the website's Work visa page straight away. Candidates apply without an account, and the Travel team decides whether an interview and a medical test are needed, then follows the visa to departure.",
    steps: [
      <><b>1. Add a job.</b> Open <Link href="/catalogue/jobs">Job vacancies</Link> → <b>Add</b> and fill in:<br />
        • <b>The job</b> - job title (designation), job category (reuse the same spelling: Hospitality, Construction, Driving, Healthcare ...), number of positions, employer name (leave empty to keep it private) and the description.<br />
        • <b>Country</b> - region (Middle East, Asia, Europe ...), country and city.<br />
        • <b>Salary, contract and work visa</b> - salary from and up to (same number for a fixed salary), currency (AED, QAR, SAR, KWD, OMR, USD ...), paid per month, contract length, work visa type and benefits (one per line: accommodation, food, air ticket, medical insurance ...).<br />
        • <b>Who can apply</b> - requirements and documents needed (one per line), age range, gender (empty = anyone) and years of experience.<br />
        • <b>Announced interview</b> (optional) - walk-in, by invitation or online, with the date, time and place, and notes for candidates.<br />
        • <b>Publishing</b> - the closing date, <b>Feature</b> (shows it first) and Status <b>Published</b>. Add photos if you like.</>,
      <><b>2. What the customer sees.</b> A published job shows at once in the website menu (<b>Work visa</b> → its country), in the <b>Country</b> and <b>Job</b> search lists, in the 3-step apply box, under <b>Jobs by country</b>, in the job list and on its own job page with Google job search details. A <b>Draft</b> or <b>Archived</b> job, or one past its closing date, no longer takes applications.</>,
      <><b>3. How the customer applies.</b> On the Work visa page: <b>Step 1</b> tap a country and a job card → <b>Next</b>. <b>Step 2</b> the form opens: name, mobile / WhatsApp, email, experience, message and (optional) CV, passport copy and photo → <b>Send my application</b>. <b>Step 3</b> they see their reference (e.g. TRV-APP-2026-00012) and get an email. Clicking <b>Apply</b> on a job card or job page opens the same form. No account is needed.</>,
      <><b>4. New application.</b> It appears under <Link href="/jobs/applications">Job applications</Link> as <b>New</b> (with a number on the menu), and the office phone gets an SMS once SMS is set up. Open it to see the candidate&apos;s details, CV and documents (passport copies wait for approval under <Link href="/documents">Document approvals</Link>).</>,
      <><b>5. Call the candidate and decide.</b> Interview needed? Click <b>Shortlist</b>, then fill in <b>Invite to an interview</b>: our office interview, employer interview, trade test or embassy interview; in person (address), video (paste the link) or phone; date and time in Sri Lanka time; who interviews; a message such as what to bring. Click <b>Send invitation</b> - the candidate gets an email and sees it in <b>My account → My work visa</b>. No interview needed? Click <b>Mark selected</b> straight away.</>,
      <><b>6. Results.</b> After each interview click <b>Passed</b>, <b>Failed</b>, <b>Did not attend</b> or <b>Cancel</b> - the candidate is told. You can add more interviews (for example the employer after our own). When the employer accepts the candidate, click <b>Mark selected</b>.</>,
      <><b>7. Medical (only if needed).</b> Click <b>Medical needed</b>, then book it in the same invite form: choose <b>Medical test</b>, the date and time, the medical centre address and its name, and instructions (e.g. come fasting). The candidate gets an email and it shows in their account. Record <b>Passed</b> / <b>Failed</b> afterwards. No medical needed? Skip this step.</>,
      <><b>8. Visa and departure.</b> Click <b>Send to visa processing</b> (visa submission, SLBFE registration, ticket), then <b>Mark departed</b> when the candidate flies - this closes the file. To close an application at any time, click <b>Not selected</b> and give a short reason - the candidate sees it and scheduled interviews are cancelled.</>,
    ],
    tips: [
      <>Each step emails the candidate (and sends an SMS once SMS is set up). <b>Internal notes</b> are never shown to the candidate - use them for interview feedback, medical results, visa numbers.</>,
      <>The candidate follows everything in <b>My account → My work visa</b>: a 6-step tracker (Apply → Interview if needed → Selected → Medical if needed → Work visa → Fly), the next interview or medical highlighted, past results, and their documents - they can upload more there, or withdraw before the visa starts.</>,
      <>A candidate who applied without an account just registers with the <b>same email</b> - everything appears in My work visa automatically.</>,
      <>Use <b>All applicants for this job</b> on an application, or the Status filter on the list, to see who is waiting at each step.</>,
      <>Passport copies are personal documents: only staff allowed to see restricted documents can open them, and every view is logged.</>,
      <>The 8 sample jobs (UAE, Qatar, Saudi Arabia ...) have example salaries and dates - edit them or set them to Archived before going live.</>,
    ],
  },
  {
    id: "languages",
    group: "Daily work",
    title: "Website languages (English, Sinhala, Tamil, Spanish)",
    intro: "Visitors choose their language with the globe button in the website's top menu. The menu, home, About us, Contact and the whole work visa journey (Work visa page, job pages, apply form, My work visa) are translated. Other pages are being translated step by step.",
    steps: [
      <>What <b>you type in the admin</b> - job titles, descriptions, benefits, product and tour names - is shown <b>exactly as typed</b> in every language. Write it in English, or add the Sinhala / Tamil words in the same field if you want both (e.g. &quot;Housemaid / ගෘහ සේවිකා&quot;).</>,
      <>The website&apos;s own words (menus, buttons, headings, the apply form) come from the website&apos;s translation files - ask your developer to change them.</>,
      <>Applications look the same in the admin whatever language the candidate used - names, phone numbers and documents arrive as they were entered.</>,
    ],
    tips: [
      <>Before going live, ask a native Sinhala and Tamil speaker to read the Work visa page in their language and report any wording to improve.</>,
      <>The emails and SMS sent to customers are still in English.</>,
    ],
  },
  {
    id: "leadership",
    group: "Daily work",
    title: "Directors, shareholders & managers",
    intro: "Show who runs the company on the website, so customers can reach management if something goes wrong with our team.",
    steps: [
      <>Open <Link href="/catalogue/team">Directors &amp; managers</Link> (menu: Website) and click <b>Add</b>.</>,
      <>Enter the <b>full name</b>, choose the <b>position</b> from the list (Managing Director, Travel Manager ... - or <b>Other</b> and type it) and tick every <b>Role</b> that applies: <b>Director</b>, <b>Shareholder</b>, <b>Manager</b>. For a manager, choose the <b>division</b> they run.</>,
      <>Add the <b>email</b>. The <b>Phone</b> box appears only when <b>Manager</b> is ticked - directors and shareholders are never shown with a phone number, and none is kept for them.</>,
      <>For shareholders you may enter the <b>shareholding %</b> - it is for staff only and never shown on the website.</>,
      <>Optionally add a short introduction and a <b>photo</b>: click <b>Choose from computer</b> and pick a JPG, PNG or WEBP picture (a square photo looks best), or <b>Use a link</b> to paste a web address. Without a photo the website shows the person&apos;s initials. Use <b>Order</b> to choose who comes first (smaller numbers first) and keep Status <b>Published</b>.</>,
      <>The website shows them at once: <b>About us → Our leadership</b>, and <b>Contact → Need to reach our management?</b> - managers with email and phone, directors and shareholders with email only.</>,
    ],
    tips: [
      <>The list shows everyone in a table: name, position, role, division, email, phone (managers only), order and status. Click a name to edit.</>,
      <>To take someone off the website, set Status to <b>Draft</b> or click <b>Delete</b> (it is archived and can be restored).</>,
      <>Only staff with the website content permission can add or change people.</>,
    ],
  },
  {
    id: "customers",
    group: "Daily work",
    title: "Customers",
    intro: "Everyone who enquired, booked or bought. Website sign-ups are added automatically.",
    steps: [
      <>Open <Link href="/customers">Customers</Link> to search by name, email or phone. Click one to see and edit their details.</>,
      <>Walk-in or phone customer? Use <Link href="/customers/new">Add customer</Link>.</>,
      <>Delete only hides a customer (the history stays); you can restore them later.</>,
    ],
  },
  {
    id: "sales",
    group: "Daily work",
    title: "Quotations, orders and payments",
    intro: "From a price offer to a paid order.",
    steps: [
      <><b>Quotations</b>: see every quotation with its status and validity. <b>Open</b> or <b>download the PDF</b> to send or print it. Customers accept or reject quotations in their website account.</>,
      <><b>Orders &amp; bookings</b>: an accepted quotation or event booking waits as <b>Waiting for approval</b>. <b>Approve</b> or <b>cancel</b> it - the customer is emailed either way.</>,
      <><b>Online shop orders</b> confirm themselves when the card payment arrives (PayHere or Stripe).</>,
      <><b>Payments</b>: card payments are confirmed automatically. Click a paid payment's <b>receipt</b> to open it, or <b>View in Stripe</b> to see the card payment there.</>,
    ],
    tips: [
      <>Unpaid card checkouts are cancelled after 1 hour, bank transfers after 3 days, and the items go back into stock.</>,
      <>Confirming a bank transfer, refunds and creating quotations are not in the admin screens yet - the system supports them, and buttons for them are the next step to build.</>,
    ],
  },
  {
    id: "documents",
    group: "Daily work",
    title: "Document approvals",
    intro: "Some documents customers upload (for example passport copies for a visa) must be checked by an admin.",
    steps: [
      <>Open <Link href="/documents">Document approvals</Link>. Waiting documents are at the top.</>,
      <>Open the file, then <b>Approve</b> it, or <b>Cancel</b> it with a reason - e.g. “The photo page is blurred. Please upload a clear scan.” The customer sees the reason and can upload again.</>,
    ],
  },

  // ─────────────── Catalogue & website ───────────────
  {
    id: "catalogue",
    group: "Catalogue & website",
    title: "Adding and editing products, tours and listings",
    intro: "Everything shown on the website is managed under Catalogue in the menu.",
    steps: [
      <>Choose the list (Shop products, Tour packages, Hotels, Events, Gems, Vehicles, Spare parts, Import or Export products) and click <b>Add</b>.</>,
      <>Fill in the form. <b>Photos</b>: paste image links, one per line - the <b>first photo is the cover</b>. Use <b>Move up / Move down</b> to change the order.</>,
      <><b>Pricing</b>: <b>Fixed price</b> shows the price and lets customers buy or book online. <b>Price on request</b> hides the price and shows an enquiry form instead.</>,
      <>New items start as <b>Draft</b> (only staff see them). Set <b>Status</b> to <b>Published</b> to show them on the website.</>,
      <><b>Delete</b> only archives an item: it disappears from the website but keeps its history, and <b>Restore</b> brings it back as a draft.</>,
    ],
    tips: [
      <>Import and Export products have a <b>Labelled price</b>: enter a higher “was” price and the website shows it crossed out with a discount badge, e.g. <s>Rs 18,900</s> Rs 14,900 (−21%).</>,
      <>The <b>Website preview</b> on the form shows how the item will look before you save.</>,
    ],
  },
  {
    id: "shop",
    group: "Catalogue & website",
    title: "Online shop",
    intro: "The website's Shop page sells retail Shop products plus every fixed-price gem, vehicle part and import/export product.",
    steps: [
      <>Add retail items under <Link href="/catalogue/shop">Shop products</Link>: name, category (e.g. Gifts, Home &amp; Living - customers filter by it), price, stock and photos.</>,
      <><b>Sale</b>: enter an <b>Original price</b> higher than the selling price. Add <b>Sale ends</b> for a countdown; after that time the sale disappears by itself.</>,
      <>Tick <b>Feature this product</b> to show it first. Keep <b>Stock</b> up to date - at 0 the product shows <b>Sold out</b>.</>,
      <>Customers pay by card (PayHere / Stripe) or bank transfer. Their orders appear under <b>Orders &amp; bookings</b> and <b>Payments</b>. A bank transfer reference starts with <b>CHK-</b>, so you can match the money in the bank to the order.</>,
    ],
  },
  {
    id: "gallery-reviews",
    group: "Catalogue & website",
    title: "Travel gallery and customer reviews",
    intro: "Photos from past trips and what customers say.",
    steps: [
      <><Link href="/gallery">Travel gallery</Link>: <b>Add a photo</b> (upload a file or paste a link), add a title, place and trip date, then <b>Publish</b>. Lower order numbers come first.</>,
      <><Link href="/reviews">Customer reviews</Link>: reviews go live as soon as a customer posts them. <b>Hide</b> abusive, spam or untrue ones with a reason, <b>Publish again</b>, or <b>Delete permanently</b>.</>,
    ],
    tips: [
      <>Only customer accounts can write reviews - staff and admin accounts see a note instead of the form. To test, sign in on the website with a customer account.</>,
    ],
  },
  {
    id: "users",
    group: "Catalogue & website",
    title: "Users, roles and suppliers",
    intro: "Who can do what in the admin portal.",
    steps: [
      <><Link href="/users/new">Add user</Link> creates a staff, finance, admin or supplier account. Customers register on the website themselves.</>,
      <><b>Roles</b>: <b>Staff</b> work on enquiries, appointments, quotations and the catalogue of their own divisions. <b>Finance</b> looks after payments. <b>Admin</b> can do everything, including users and reviews. Choose the password when you create the account and give it to the person securely.</>,
      <>Tick the staff member's <b>divisions</b> (Travel, Gems ...) - they only see those. Fine-tune with <b>privileges</b> if needed.</>,
      <><Link href="/suppliers">Suppliers</Link>: supplier details and costs are internal and never shown to customers.</>,
    ],
  },
  {
    id: "social",
    group: "Catalogue & website",
    title: "Sharing on Facebook, Instagram and WhatsApp",
    intro: "Every tour and product page on the website has Share buttons.",
    steps: [
      <>Open the tour or product on the <b>website</b> (not the admin). In the <b>Share</b> box click <b>Facebook</b>.</>,
      <>On Facebook, change “post to” from your own profile to the <b>Gazellekey Page</b>, write a short message (next date, special price) and click <b>Post</b>. The post shows the photo, title and description automatically.</>,
      <><b>Instagram</b> does not allow clickable links in posts: post the photo and write “Link in bio”, or in a <b>Story</b> use the Share box's copy-link button and a <b>Link sticker</b>.</>,
      <><b>WhatsApp</b>: the first Share button sends the page to a chat or group.</>,
    ],
    tips: [
      <>Sharing works only when the website is <b>live on the internet</b> - Facebook cannot read a website running on a computer (localhost). See <a href="#go-live">Going live</a>.</>,
      <>To connect your social pages (footer icons and the WhatsApp chat button), see <a href="#social-setup">Connect social media</a>.</>,
    ],
  },

  // ─────────────── Setup ───────────────
  {
    id: "settings-file",
    group: "Setup",
    title: "Before you start: the settings file",
    intro: "All connections (SMS, Google, payments) are switched on in one settings file of the backend API. Keys go only in this file - never in chat, email or screenshots.",
    steps: [
      <>In VS Code open <code className="rounded bg-slate-100 px-1.5">{ENV_FILE}</code>. (<code className="rounded bg-slate-100 px-1.5">.env.example</code> next to it lists every setting with an explanation.)</>,
      <>Add or change the lines shown in the setup sections below, then save the file.</>,
      <><b>Restart the API</b> so it reads the new settings: in the terminal running it press <b>Ctrl + C</b>, then type <b>npm run dev</b> and wait for <b>Ready</b>.</>,
    ],
    tips: [
      <>The .env file is never uploaded to GitHub, so your keys stay private.</>,
    ],
  },
  {
    id: "sms",
    group: "Setup",
    title: "SMS reminders to the office phone (Notify.lk)",
    intro: "Every new appointment and enquiry sends a text to the office phone with the customer's name, phone and a link to open it here.",
    steps: [
      <>Go to <b>notify.lk</b>, sign up with your mobile number and email, and top up your account (an SMS costs about Rs 1).</>,
      <>In the Notify.lk dashboard open <b>Settings → API Keys</b> and copy the <b>User ID</b> and <b>API Key</b>.</>,
      <>Sender ID: use <b>NotifyDEMO</b> while testing. To show “Gazellekey” as the sender, request a custom sender ID from Notify.lk (approval takes a few days).</>,
      <>Add these lines to the settings file (with your own values) and restart the API:</>,
    ],
    extra: (
      <>
        <Code>{`NOTIFYLK_USER_ID="12345"
NOTIFYLK_API_KEY="your-api-key"
NOTIFYLK_SENDER_ID="NotifyDEMO"
OFFICE_ALERT_PHONE="0771234567"
ADMIN_URL="http://localhost:3001"`}</Code>
        <Note>
          <b>OFFICE_ALERT_PHONE</b> is the phone that gets the reminders. <b>ADMIN_URL</b> is the address of this admin portal - change it to the
          real address when you go live, so the links in the SMS work from a phone. To also text customers (next to their emails), add{" "}
          <code>SMS_ENABLED=&quot;true&quot;</code>.
        </Note>
      </>
    ),
  },
  {
    id: "google-calendar",
    group: "Setup",
    title: "Google Calendar reminders",
    intro: "Bookings appear in the office calendar (yellow = to confirm, green = confirmed) and each enquiry adds a red “Reply to enquiry” note. The Google Calendar app on staff phones shows the reminders.",
    steps: [
      <>Go to <b>console.cloud.google.com</b>, sign in with the Gazellekey Google account and create a project (e.g. “Gazellekey website”).</>,
      <>Search for <b>Google Calendar API</b> and click <b>Enable</b>.</>,
      <>Open <b>IAM &amp; Admin → Service accounts → Create service account</b> (any name). Open it, go to <b>Keys → Add key → JSON</b>. A file downloads - keep it private.</>,
      <>Open <b>Google Calendar</b> on a computer → your office calendar → <b>Settings and sharing → Share with specific people</b>. Add the <b>client_email</b> from the JSON file with permission <b>Make changes to events</b>.</>,
      <>On the same settings page, copy the <b>Calendar ID</b> (under “Integrate calendar”).</>,
      <>Add these lines to the settings file and restart the API:</>,
    ],
    extra: (
      <>
        <Code>{`GOOGLE_CALENDAR_ID="the-calendar-id@group.calendar.google.com"
GOOGLE_SERVICE_ACCOUNT_EMAIL="client_email from the JSON file"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`}</Code>
        <Note>Copy <b>private_key</b> exactly as it is in the JSON file, including every <code>\n</code>, inside the quotes.</Note>
        <h4 className="mt-6 font-semibold text-navy-950">On your phone</h4>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-slate-700">
          <li>Install the <b>Google Calendar</b> app and sign in with the Gazellekey Google account (or an account the office calendar is shared with).</li>
          <li>In the app's menu, make sure the office calendar is <b>ticked</b>.</li>
          <li>Allow <b>notifications</b> for Google Calendar in the phone's settings.</li>
        </ol>
      </>
    ),
  },
  {
    id: "test-reminders",
    group: "Setup",
    title: "Test the reminders",
    intro: "Check everything works before you rely on it.",
    steps: [
      <>Open the <b>website</b>, sign in with a customer account (or a private browser window) and book an appointment under <b>Book appointment</b>.</>,
      <>Within seconds the office phone should get the SMS, and the yellow <b>To confirm</b> event appears in Google Calendar.</>,
      <>Send an enquiry from any contact form: you get an SMS, and about 5 minutes later the calendar app pops up <b>Reply to enquiry</b>.</>,
      <>Cancel the test booking afterwards. If nothing arrives, check the terminal running the API - it prints the reason (e.g. a wrong API key).</>,
    ],
  },
  {
    id: "assistant",
    group: "Setup",
    title: "Website chat assistant (AI)",
    intro: "The chat bubble on every website page answers visitors' questions about tours, the shop, rentals and services, 24/7. It looks up real prices and availability and sends people to the right page or to your team.",
    steps: [
      <>Go to <b>console.anthropic.com</b> and sign up or log in with the company email.</>,
      <>Open <b>Settings → Billing</b> and add credit (for example USD 10) - the key does not work without credit. On the same page set a <b>monthly spend limit</b>.</>,
      <>Open <b>API Keys → Create Key</b>, name it “Gazellekey website” and <b>copy</b> it. It starts with <code>sk-ant-</code> and is shown only once - if you lose it, create a new one.</>,
      <>In VS Code open the file <code className="rounded bg-slate-100 px-1.5">{ENV_FILE}</code> - exactly <b>.env</b>, <b>not .env.example</b>. Press <b>Ctrl + End</b> to go to the last line.</>,
      <>Paste the key <b>between the two quotes</b> of the ANTHROPIC_API_KEY line, so it looks like the example below.</>,
      <>Press <b>Ctrl + S</b>. Check the tab of the file shows an <b>×</b>, not a white dot ● (a dot means it is not saved yet).</>,
      <><b>Restart the API</b>: in its terminal press <b>Ctrl + C</b>, type <b>npm run dev</b> and wait for <b>Ready</b>. The API reads the settings file only when it starts.</>,
      <>Reload the website and ask the chat bubble something, e.g. “Tours to Thailand?”. In the API terminal you now see <b>POST /api/chat 200</b>.</>,
    ],
    extra: (
      <>
        <Code>{`ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxxxxxxxxx"`}</Code>
        <Note tone="warn">
          Never put the real key in <b>.env.example</b> (that file is a template and is uploaded to GitHub), and never send it by chat, email or
          screenshot. If a key was shared by mistake, delete it in the Anthropic console and create a new one.
        </Note>
        <Note>
          Each answer costs a few US cents (most chats under USD 0.30). The monthly spend limit makes sure the cost can never run away, and each
          visitor can send at most 20 messages per 10 minutes.
        </Note>

        <h4 className="mt-6 font-semibold text-navy-950">If the chat says “The chat assistant is not set up yet”</h4>
        <p className="mt-1 text-sm text-slate-600">
          The API terminal shows <b>POST /api/chat 503</b>. The API cannot see a key. Check, in this order:
        </p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
          <li>
            The key is in <b>.env</b>, not in .env.example or another file.
          </li>
          <li>
            The line is not empty: <code>ANTHROPIC_API_KEY=&quot;&quot;</code> with nothing between the quotes means the key was not pasted.
          </li>
          <li>The file is saved - no white dot ● on its tab.</li>
          <li>
            The line does not start with <code>#</code> (that turns it off), and the key has no spaces or line breaks in it.
          </li>
          <li>You restarted the API <b>after</b> saving the file.</li>
        </ol>

        <h4 className="mt-6 font-semibold text-navy-950">If the chat says “Sorry, something went wrong” or “the assistant is busy”</h4>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
          <li>
            The API terminal shows the reason after <b>Chat assistant failed</b>. “authentication” or “invalid x-api-key” = the key is wrong or was
            deleted: create a new one.
          </li>
          <li>“credit balance is too low” = add credit under Billing in the Anthropic console.</li>
          <li>“rate limit” or “overloaded” = too many messages at once: wait a minute and try again.</li>
        </ol>
      </>
    ),
    tips: [
      <>The assistant only quotes prices and stock it looks up from your catalogue, so keep products, tours and rental items up to date in the admin.</>,
      <>It never takes payments or promises discounts - quotations, custom tours and complaints are sent to /contact or an appointment.</>,
      <>Visitors see a note that AI answers can be wrong and that your team confirms prices and bookings.</>,
    ],
  },
  {
    id: "social-setup",
    group: "Setup",
    title: "Connect social media",
    intro: "Your page links show as icons in the website footer, and the WhatsApp number adds a green chat button.",
    steps: [
      <>Open <code className="rounded bg-slate-100 px-1.5">gazellekey-web/lib/social.ts</code> in VS Code.</>,
      <>Paste the full link of each page you use between the quotes. Leave “” for networks you do not use - they stay hidden.</>,
      <>Add the WhatsApp number in international format, digits only (94 = Sri Lanka). Save - the website updates by itself.</>,
    ],
    extra: (
      <Code>{`export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/gazellekey",
  instagram: "https://www.instagram.com/gazellekey",
  linkedin: "",
  youtube: "",
  tiktok: "",
  x: "",
};

export const WHATSAPP_NUMBER = "94771234567";`}</Code>
    ),
    tips: [
      <>Photo cards on Facebook and WhatsApp need the live website address - set <b>NEXT_PUBLIC_SITE_URL</b> (see <a href="#go-live">Going live</a>).</>,
      <>If Facebook shows an old photo for a shared link, paste the link into Facebook's free <b>Sharing Debugger</b> and click <b>Scrape again</b>.</>,
    ],
  },
  {
    id: "payments-setup",
    group: "Setup",
    title: "Online payments, bank details and Google sign-in",
    intro: "Switch on only what you use. Each has a short explanation in .env.example.",
    steps: [
      <><b>PayHere</b> (Sri Lankan cards and wallets): merchant ID and secret from the PayHere portal → <b>Settings → Domains &amp; Credentials</b>.</>,
      <><b>Stripe</b> (international cards): secret key and webhook secret from the Stripe dashboard.</>,
      <><b>Bank transfer</b>: fill in <b>BANK_ACCOUNT_NAME</b>, <b>BANK_ACCOUNT_NUMBER</b>, <b>BANK_NAME</b> (and branch / SWIFT). Customers see them at checkout.</>,
      <><b>“Sign in with Google”</b> for customers: <b>GOOGLE_CLIENT_ID</b> and <b>GOOGLE_CLIENT_SECRET</b> from Google Cloud → <b>APIs &amp; Services → Credentials</b>.</>,
      <>Restart the API after changing any of these.</>,
    ],
    tips: [<>Start with test keys, make a test purchase, then switch to live keys.</>],
  },
  {
    id: "go-live",
    group: "Setup",
    title: "Going live checklist",
    intro: "Before the website is opened to the public.",
    steps: [
      <>Put the three apps on a server with their real addresses (e.g. gazellekey.com for the website, admin.gazellekey.com for this portal).</>,
      <>Website settings (<b>.env.local</b>): <b>NEXT_PUBLIC_SITE_URL</b> = the website address, <b>API_URL</b> = the API address, <b>NEXT_PUBLIC_ADMIN_URL</b> = this portal's address.</>,
      <>Admin settings (<b>.env.local</b>): <b>API_URL</b> = the API address.</>,
      <>API settings (<b>.env</b>): <b>WEBSITE_URL</b> and <b>ADMIN_URL</b> = the real addresses; live payment keys; a long random <b>JOSE_SECRET</b>.</>,
      <>Replace the sample products, tours and photos with your own, and change the sample prices.</>,
      <>Test once on the live site: register, book, enquire, buy, and share a page on Facebook.</>,
      <>When it is ready for customers, set <b>NEXT_PUBLIC_SEARCH_INDEXING=&quot;on&quot;</b> in the website's <b>.env.local</b> and restart it. Until then search engines are told to stay away (fine for testing on a temporary address).</>,
      <>Add the site to <b>Google Search Console</b> (search.google.com/search-console) and submit <b>/sitemap.xml</b> - it lists every tour and product and updates itself. Register <b>Google Business Profile</b> (business.google.com) for the company panel and Google Maps.</>,
      <>Fill in the company phone, email and address in <b>gazellekey-web/lib/social.ts</b> (COMPANY) so search engines show the right details.</>,
    ],
  },
  {
    id: "troubleshooting",
    group: "Setup",
    title: "Problems and quick fixes",
    intro: "The most common messages and what to do.",
    steps: [
      <><b>“address already in use :::3100”</b> when starting the API: another copy is already running. Use the one that is running, or stop it with the command below and start again.</>,
      <><b>“Sign in failed”</b> in the admin: the API is not running, or the admin's <b>API_URL</b> does not point to it (http://localhost:3100 on this computer).</>,
      <><b>A page shows an error after an update</b>: restart the API (Ctrl + C, then npm run dev).</>,
      <><b>No SMS or calendar event</b>: check the settings file values, restart the API, and read the message in the API's terminal.</>,
      <><b>Chat bubble says “not set up yet”</b> (POST /api/chat 503): the Anthropic key is missing, empty, not saved or the API was not restarted - see <a href="#assistant">Website chat assistant</a>.</>,
      <><b>A change in the settings file does nothing</b>: it must be <b>.env</b> (not .env.example), saved (no white dot ● on the tab), and the API restarted afterwards.</>,
    ],
    extra: (
      <Code>{`Get-NetTCPConnection -LocalPort 3100 -State Listen | % { taskkill /PID $_.OwningProcess /T /F }
npm run dev`}</Code>
    ),
  },
];

const GROUPS = ["Daily work", "Catalogue & website", "Setup"] as const;

export default function GuidePage() {
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="User guide"
        description="How to use the admin portal every day, and how to set up reminders, Google Calendar, SMS, social media and going live."
      />

      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        {/* Contents */}
        <nav aria-label="Guide contents" className="card h-fit p-5 lg:sticky lg:top-24">
          {GROUPS.map((group) => (
            <div key={group} className="mb-4 last:mb-0">
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">{group}</p>
              <ul className="mt-2 space-y-1">
                {SECTIONS.filter((section) => section.group == group).map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="block rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-navy-950">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="min-w-0 space-y-6">
          {GROUPS.map((group) => (
            <div key={group} className="space-y-6">
              <h2 className="pt-2 text-xs font-bold tracking-widest text-gold-600 uppercase">{group}</h2>
              {SECTIONS.filter((section) => section.group == group).map((section) => (
                <section key={section.id} id={section.id} className="card scroll-mt-24 p-6 sm:p-8">
                  <h3 className="text-xl font-bold tracking-tight text-navy-950">{section.title}</h3>
                  <p className="mt-2 max-w-3xl text-slate-600">{section.intro}</p>
                  {section.steps ? (
                    <ol className="mt-5 space-y-3">
                      {section.steps.map((step, index) => (
                        <li key={index} className="flex gap-3 text-slate-700">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-950 text-xs font-bold text-gold-400">
                            {index + 1}
                          </span>
                          <span className="min-w-0 pt-0.5 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {section.extra}
                  {section.tips ? (
                    <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                      {section.tips.map((tip, index) => (
                        <li key={index} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-gold-600" aria-hidden="true">★</span>
                          <span className="min-w-0">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
