# Campus Notification Hub

A React-based College Notification System built for displaying, filtering, and prioritizing campus notifications such as placements, results, and events.

## Repository Link

https://github.com/Harinichennamsetty/2023003660

## Project Overview

Campus Notification Hub is a frontend application that fetches notifications from a protected backend API and displays them in a clean dashboard. The system helps students quickly view important updates by giving higher priority to important categories like placement notifications.

The application supports:

* Priority Inbox
* All Notifications view
* Notification filtering
* Read and unread tracking
* Pagination
* Token-based API authentication
* Logging middleware telemetry
* Clean React UI using Material UI

## Tech Stack

* React.js
* Vite
* JavaScript
* Material UI
* CSS
* LocalStorage
* Fetch API
* Logging Middleware

## Folder Structure

```text
2023003660/
│
├── logging_middleware/
│   └── log.js
│
├── notification_app_fe/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── setupProxy.js
│   │
│   ├── package.json
│   └── vite.config.js
│
├── notification_system_design.md
└── README.md
```

## Features

### 1. Priority Inbox

The Priority Inbox shows the most important notifications first.

Priority order:

```text
Placement > Result > Event
```

Sorting logic:

1. Unread notifications are shown first.
2. Higher priority notification type is shown first.
3. Newer notifications are shown first.

### 2. All Notifications

The All Notifications section displays all fetched notifications in table format.

Each notification contains:

* Message
* Notification Type
* Timestamp
* Read/Unread status
* Action button

### 3. Notification Filters

Users can filter notifications based on:

* Notification type
* Priority count

### 4. Read/Unread Tracking

Users can mark notifications as read or unread.

Read notification IDs are stored in browser `localStorage`, so the status remains even after refreshing the page.

### 5. Token Settings

The notification API is protected.

Users can paste a fresh bearer token using the Token Settings button.

The token is stored in localStorage and used in API requests.

### 6. Logging Middleware

The application logs important frontend events such as:

* Page loaded
* API fetch started
* API fetch success
* API fetch failure
* User actions
* State changes

Logs are displayed in the Logging Middleware Telemetry Output section.

## API Used

### Notification API

```text
GET http://4.224.186.213/evaluation-service/notifications
```

The API is protected and requires a bearer token.

### Sample Response

```json
{
  "notifications": [
    {
      "ID": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "Type": "Result",
      "Message": "mid-sem",
      "Timestamp": "2026-04-22 17:51:30"
    },
    {
      "ID": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
      "Type": "Placement",
      "Message": "CSX Corporation hiring",
      "Timestamp": "2026-04-22 17:51:18"
    },
    {
      "ID": "81589ada-0ad3-4f77-9554-f52fb558e09d",
      "Type": "Event",
      "Message": "farewell",
      "Timestamp": "2026-04-22 17:51:06"
    }
  ]
}
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Harinichennamsetty/2023003660.git
```

### 2. Go to the frontend folder

```bash
cd 2023003660/notification_app_fe
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the project

```bash
npm run dev
```

### 5. Open in browser

```text
http://localhost:3000
```

## Required Dependencies

Install Material UI and required packages:

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

If proxy support is needed:

```bash
npm install http-proxy-middleware
```

## Usage Steps

1. Start the application using `npm run dev`.
2. Open `http://localhost:3000`.
3. Click Token Settings.
4. Paste the fresh access token.
5. Click Apply Token.
6. Click refresh.
7. View notifications in Priority Inbox or All Notifications.
8. Use filters and read/unread actions.

## Screenshots

### Dashboard View

<img width="1846" height="963" alt="Dashboard Screenshot" src="https://github.com/user-attachments/assets/31da1ebd-82ec-4716-a81a-90313c187fc4" />

### Priority Inbox View

<img width="1852" height="961" alt="Priority Inbox Screenshot" src="https://github.com/user-attachments/assets/2400549a-1840-4de9-a555-f8970b02c8c3" />

### Logging Middleware Output

<img width="1857" height="960" alt="Logging Screenshot" src="https://github.com/user-attachments/assets/e224c141-9154-45ef-9ecf-64eeab2c0a0f" />
<img width="1425" height="852" alt="image" src="https://github.com/user-attachments/assets/eec78281-be42-439c-b0a5-3cb392206d23" />


## Authentication

The API requires a valid bearer token.

The token can be generated using the authentication API and pasted into the frontend using Token Settings.

Do not hardcode tokens permanently in the source code because tokens expire and may expose sensitive information.

## Important Notes

* The notification API is protected.
* Access tokens may expire.
* If the API fails, generate a fresh token and paste it again.
* If browser requests fail due to CORS, configure a development proxy.
* Do not commit private tokens or secrets to GitHub.

## Completed Functionalities

* React frontend setup
* Campus notification dashboard
* API integration
* Token input support
* Priority-based notification sorting
* Read/unread status tracking
* Notification table UI
* Material UI styling
* Logging middleware output
* GitHub repository setup

## Future Improvements

* Add backend proxy for better API security
* Add login page
* Add role-based dashboard for admin and students
* Add notification creation form
* Add search option
* Add database storage for read/unread status
* Add deployment support

## Author

**Harini Chennamsetty**

Roll Number: `2023003660`

Email: `hchannam@gitam.in`

GitHub: `Harinichennamsetty`
