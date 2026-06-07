# Campus Notifications Microservice System Design

This document details the architectural design, priority algorithm, state management, and logging strategy implemented for the Campus Notifications Platform.

---

## Stage 1: Priority Inbox Algorithm & Stream Efficiency

### Priority Inbox Logic
The Priority Inbox displays the most important notifications first. Priority is computed using a lexicographical scoring strategy:
1. **Unread Status (Primary)**: Unread notifications are given higher priority than read notifications.
2. **Notification Type Weight (Secondary)**: 
   - `Placement`: Weight 3 (Highest)
   - `Result`: Weight 2
   - `Event`: Weight 1 (Lowest)
3. **Recency (Tertiary)**: If the unread status and type weight are identical, notifications are sorted by timestamp (newest first).

```
Priority Tuple = (isUnread, typeWeight, TimestampEpochSeconds)
```

### Efficiently Maintaining Top $K$ (e.g., $K = 10$) in a Live Stream
In a live system, new notifications are continuously produced. Sorting the entire list of $N$ notifications whenever a new item arrives takes $O(N \log N)$ time, which is highly inefficient for large values of $N$ and blocks the main thread.

#### The Heap Solution
To maintain the top $K$ priority notifications efficiently, we use a **Min-Heap** of size $K$ ordered by the Priority Tuple:
1. **Initialization**: Keep a Min-Heap of size $K$.
2. **Streaming Ingest**: For each incoming notification $x$ in the stream:
   - If the heap has size $< K$, insert $x$ into the heap in $O(\log K)$ time.
   - If the heap has size $K$, compare $x$ with the root of the heap (the lowest-priority item currently in the top $K$ list).
   - If $x$ has higher priority than the root:
     - Perform a `Replace` operation (extract the root and insert $x$) in $O(\log K)$ time.
   - If $x$ has lower or equal priority than the root, discard it (since it cannot be in the top $K$).
3. **Complexity**: The time complexity to process $N$ live notifications is **$O(N \log K)$** instead of $O(N \log N)$. Since $K$ is small (e.g., 10), $\log K \approx 3.32$, making this operation extremely fast and constant-time relative to list growth.
4. **Memory Constraint**: The system only keeps $K$ items in memory, avoiding memory leaks.

---

## Stage 2: Frontend Architecture & Observability

### Folder Structure
The React frontend is modularly structured to maintain code readability and clean separation of concerns:
```text
notification_app_fe/
├── src/
│   ├── App.css             # Simplified CSS styles & theme tokens
│   ├── App.jsx             # App core dashboard & layout logic
│   ├── index.css           # Standard global CSS resets
│   └── main.jsx            # React entrypoint
logging_middleware/
└── log.js                  # Whitelisted logging client
```

### Simple Table-Based Layout Decisions
For a clear and humanly designed interface, we avoid complex visual over-engineering (such as glassmorphism, glowing card lists, etc.) and instead present notifications in a standard structured table:
- **Priority Inbox**: Columns include Rank (1-5/10), Message payload (with timestamp subtext), Category (colored chip), Channel, and Actions.
- **All Notifications**: Columns include Status (Read vs New chip), Message payload, Category, Channel, and Actions.
- **Typography and Backgrounds**: Standard clean light mode theme using standard Roboto fonts with neutral Zinc backgrounds.

### State Management
- **Unread/Viewed Tracking**: Since there is no persistent backend database, the read/unread state of notifications is managed on the client side:
  - We maintain a list of `viewedNotificationIds` in React state.
  - This set is synchronized and persisted in `localStorage` (`campus_notifications_viewed_ids`).
  - When a table row's check circle is clicked, it transitions to the viewed state, localStorage is updated, and a log event is emitted.
- **Filters**: React state manages query parameters (`page`, `limit`, `notification_type`, `type`) and dynamically triggers API fetches when any filter value changes.

### API Limit Constraints
- The backend notifications endpoint enforces strict pagination parameter checks. Limits outside of `[5, 10]` will immediately fail with `400 Bad Request`.
- To prevent this, the frontend forces the pagination `limit` to be `10`, which works reliably. The Priority Inbox top-N limit (e.g. top 5 or top 10) is handled cleanly on the client side by slicing the sorted array.

### Observability & Logging Strategy
Every important lifecycle event is logged using the Whitelisted Logging Middleware:
- **API Call Logging**: Log before fetching notifications (`Log("frontend", "info", "api", "...")`) and upon successful response or error.
- **Component Lifecycle**: Log when the dashboard mounts (`Log("frontend", "info", "page", "...")`).
- **User Interactions**: Log when a filter value is changed, when a tab is switched, or when a notification is marked as viewed.
- **Dynamic Token Sync**: The logging middleware in `log.js` dynamically reads the active authorization token from `localStorage` under the same key. When a user pastes a new access token in the dashboard settings, it immediately applies to both future notification fetches and logging middleware payloads, avoiding `401 Unauthorized` errors.
