import { useEffect, useState, useMemo } from "react";
import { Log } from "../../logging_middleware/log";
import "./App.css";

// Material UI Core Imports
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Tooltip,
  Paper,
  Divider,
  Badge,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

// Material UI Icon Imports
import {
  Notifications,
  CheckCircle,
  CheckCircleOutlined,
  Refresh,
  Star,
  VpnKey,
} from "@mui/icons-material";

// Clean light-mode theme using standard fonts and neutral steel/gray colors
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb", // Standard Blue
    },
    background: {
      default: "#f4f4f5", // Zinc 100 (Clean neutral gray)
      paper: "#ffffff",
    },
    text: {
      primary: "#18181b", // Zinc 900
      secondary: "#52525b", // Zinc 600
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Inter', sans-serif",
    h5: {
      fontWeight: 700,
    },
    subtitle2: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Priority Inbox, 1 = All Notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters and Pagination
  const [type, setType] = useState(""); // email, sms, in-app
  const [notificationType, setNotificationType] = useState(""); // Event, Result, Placement
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Strictly set limit to 10 (valid API range is 5-10)
  const [topN, setTopN] = useState(5); // priority inbox top-N selector

  // Viewed (Read) Notifications - Client-side tracking in localStorage
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("campus_notifications_viewed_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Bearer Token Management
  const defaultToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJoY2hhbm5hbUBnaXRhbS5pbiIsImV4cCI6MTc4MDgxNTI2MywiaWF0IjoxNzgwODE0MzYzLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZDI2ODUyOTQtZTk4NS00MzRiLWIyY2ItNmZhZTM5MzRhODRhIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiaGFyaW5pIiwic3ViIjoiMTY1YWZkNTYtMWRiNS00NWZmLWEwZTItZTIxYjkyYjkxNzMzIn0sImVtYWlsIjoiaGNoYW5uYW1AZ2l0YW0uaW4iLCJuYW1lIjoiaGFyaW5pIiwicm9sbE5vIjoiMjAyMzAwMzY2MCIsImFjY2Vzc0NvZGUiOiJ3Z0t0Z1oiLCJjbGllbnRJRCI6IjE2NWFmZDU2LTFkYjUtNDVmZi1hMGUyLWUyMWI5MmI5MTczMyIsImNsaWVudFNlY3JldCI6InJTUnloeW1TRGJoU3pNSlIifQ.RQPMuMFcKiabhFkO7uajHok7ktgo5Z-oc7KY_G1X8CA";
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem("campus_notifications_token") || defaultToken;
  });
  const [tokenInput, setTokenInput] = useState(accessToken);
  const [showTokenForm, setShowTokenForm] = useState(false);

  // Local console logs for real-time telemetry demonstration
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  // Save viewed notification IDs
  useEffect(() => {
    localStorage.setItem("campus_notifications_viewed_ids", JSON.stringify(viewedIds));
  }, [viewedIds]);

  // Log events using the whitelisted parameters
  const logEvent = async (level, packageName, message) => {
    try {
      const timeStr = new Date().toLocaleTimeString();
      setTelemetryLogs((prev) => [
        { time: timeStr, level, package: packageName, message },
        ...prev.slice(0, 19),
      ]);
      await Log("frontend", level, packageName, message);
    } catch (err) {
      console.error("Log error:", err);
    }
  };

  // Log page mount
  useEffect(() => {
    logEvent("info", "page", "Campus Notification dashboard mounted");
  }, []);

  // Fetch from backend API
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      await logEvent("info", "api", `Fetching notifications (page=${page}, limit=${limit}, type=${type || "all"}, category=${notificationType || "all"})`);

      let url = `http://4.224.186.213/evaluation-service/notifications?page=${page}&limit=${limit}`;
      if (type) url += `&type=${type}`;
      if (notificationType) url += `&notification_type=${notificationType}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        throw new Error("Unauthorized (401) - Expired Access Token");
      }

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      const data = await response.json();
      const list = Array.isArray(data.notifications)
        ? data.notifications
        : Array.isArray(data)
        ? data
        : [];

      setNotifications(list);
      await logEvent("info", "api", `Successfully loaded ${list.length} notifications`);
    } catch (err) {
      setError(err.message);
      await logEvent("error", "api", `Failed to load notifications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when parameters or token change
  useEffect(() => {
    fetchNotifications();
  }, [page, type, notificationType, accessToken]);

  // Handle Token Save
  const handleSaveToken = async () => {
    const trimmed = tokenInput.trim();
    if (trimmed) {
      localStorage.setItem("campus_notifications_token", trimmed);
      setAccessToken(trimmed);
      setShowTokenForm(false);
      await logEvent("config", "auth", "Access Token updated by user");
    }
  };

  // Toggle Read/Unread Status
  const toggleReadStatus = async (id) => {
    if (!id) return;
    const isRead = viewedIds.includes(id);
    let updated;
    if (isRead) {
      updated = viewedIds.filter((item) => item !== id);
      await logEvent("info", "state", `Marked notification ${id} as unread`);
    } else {
      updated = [...viewedIds, id];
      await logEvent("info", "state", `Marked notification ${id} as read`);
    }
    setViewedIds(updated);
  };

  // Mark all visible notifications on current page as read
  const markAllVisibleRead = async () => {
    if (!Array.isArray(notifications)) return;
    const unreadIds = notifications
      .map((n) => n?.ID || n?.id)
      .filter((id) => id && !viewedIds.includes(id));

    if (unreadIds.length > 0) {
      setViewedIds((prev) => [...prev, ...unreadIds]);
      await logEvent("info", "state", `Marked all ${unreadIds.length} visible notifications as read`);
    }
  };

  // Tab switching handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    logEvent("info", "component", `Switched view tab to ${newValue === 0 ? "Priority Inbox" : "All Notifications"}`);
  };

  // Priority Inbox sorting logic
  // Priorities: Placement (Weight 3) > Result (Weight 2) > Event (Weight 1)
  // Sorts by: Unread status, Weight descending, then Timestamp descending (recency)
  const sortedPriorityInbox = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    
    const mapped = notifications.map((n) => {
      const category = (n?.Type || n?.type || "").toLowerCase();
      let weight = 0;
      if (category.includes("placement")) weight = 3;
      else if (category.includes("result")) weight = 2;
      else if (category.includes("event")) weight = 1;

      const isUnread = !viewedIds.includes(n?.ID || n?.id);
      const timestampSecs = n?.Timestamp ? new Date(n.Timestamp).getTime() : 0;

      return {
        ...n,
        _weight: weight,
        _isUnread: isUnread,
        _timestampSecs: timestampSecs,
      };
    });

    return mapped
      .sort((a, b) => {
        // Unread items first
        if (a._isUnread !== b._isUnread) {
          return a._isUnread ? -1 : 1;
        }
        // Higher weight category first
        if (a._weight !== b._weight) {
          return b._weight - a._weight;
        }
        // Newer timestamp first
        return b._timestampSecs - a._timestampSecs;
      })
      .slice(0, topN);
  }, [notifications, viewedIds, topN]);

  // Assign deterministic channel based on notification ID hash if no channel field exists in API response
  const getChannelName = (id, msg) => {
    if (type) {
      return type.toUpperCase();
    }
    // Deterministic channel assignment
    const hash = (id || msg || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const channels = ["EMAIL", "SMS", "IN-APP"];
    return channels[hash % 3];
  };

  // Simple category chip color scheme
  const getCategoryStyles = (category) => {
    const c = (category || "").toLowerCase();
    if (c.includes("placement")) return { label: "Placement", color: "warning" };
    if (c.includes("result")) return { label: "Result", color: "primary" };
    return { label: "Event", color: "success" };
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Box sx={{ py: 3 }}>
        <Container maxWidth="md">
          {/* Main Top Header */}
          <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: "#fff" }}>
            <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
              <Grid item xs={12} sm={8}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Badge color="error" variant="dot" invisible={!notifications.some((n) => !viewedIds.includes(n?.ID || n?.id))}>
                    <Notifications color="primary" sx={{ fontSize: 28 }} />
                  </Badge>
                  <Box>
                    <Typography variant="h5" color="text.primary">
                      Campus Notification Hub
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Roll Number: 2023003660 | hchannam@gitam.in
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4} sx={{ textAlign: { sm: "right" } }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VpnKey />}
                  onClick={() => setShowTokenForm(!showTokenForm)}
                  sx={{ mr: 1 }}
                >
                  Token Settings
                </Button>
                <IconButton onClick={fetchNotifications} disabled={loading} size="small" sx={{ border: "1px solid #ddd" }}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>

            {/* Token Settings Input Area */}
            {showTokenForm && (
              <Box sx={{ mt: 2, p: 2, border: "1px dashed #ccc", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Set Authorization Bearer Token (Expires every 15 min):
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  label="Bearer Access Token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                  <Button size="small" onClick={() => setShowTokenForm(false)}>
                    Cancel
                  </Button>
                  <Button size="small" variant="contained" onClick={handleSaveToken}>
                    Apply Token
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Error Warning Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2">
                {error.includes("401") ? "Access Token Expired (401)" : "Failed to Fetch API Data"}
              </Typography>
              <Typography variant="body2">
                {error.includes("401")
                  ? "Your 15-minute access token has expired. Please copy a new bearer token using the /auth POST API response and paste it into 'Token Settings' above."
                  : "The backend server is unreachable. Please verify that your internet is connected and the API server is online."}
              </Typography>
            </Alert>
          )}

          {/* Simple Tab Control */}
          <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
              <Tab label="Priority Inbox" />
              <Tab label="All Notifications" />
            </Tabs>
          </Paper>

          {/* Simple Filter Bar */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Channel</InputLabel>
                  <Select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setPage(1);
                      logEvent("info", "state", `Changed channel filter to ${e.target.value || "all"}`);
                    }}
                    label="Channel"
                  >
                    <MenuItem value="">All Channels</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                    <MenuItem value="in-app">In-App</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={notificationType}
                    onChange={(e) => {
                      setNotificationType(e.target.value);
                      setPage(1);
                      logEvent("info", "state", `Changed category filter to ${e.target.value || "all"}`);
                    }}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="Placement">Placement</MenuItem>
                    <MenuItem value="Result">Result</MenuItem>
                    <MenuItem value="Event">Event</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {activeTab === 0 ? (
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority Count (Top N)</InputLabel>
                    <Select
                      value={topN}
                      onChange={(e) => {
                        setTopN(Number(e.target.value));
                        logEvent("info", "state", `Updated priority limit count to ${e.target.value}`);
                      }}
                      label="Priority Count (Top N)"
                    >
                      <MenuItem value={5}>Top 5</MenuItem>
                      <MenuItem value={10}>Top 10</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              ) : (
                <Grid item xs={12} sm={4} sx={{ display: "flex", gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={markAllVisibleRead}
                    disabled={!notifications.some((n) => !viewedIds.includes(n?.ID || n?.id))}
                  >
                    Mark Page Read
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Notifications Table Representation */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={40} />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: "#fafafa" }}>
                  <TableRow>
                    {activeTab === 0 ? (
                      <TableCell sx={{ fontWeight: "bold", width: "10%" }}>Rank</TableCell>
                    ) : (
                      <TableCell sx={{ fontWeight: "bold", width: "10%" }}>Status</TableCell>
                    )}
                    <TableCell sx={{ fontWeight: "bold", width: "50%" }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "15%" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "15%" }}>Channel</TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "10%" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeTab === 0 ? (
                    /* Priority Inbox Table Rows */
                    sortedPriorityInbox.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No notifications found in Priority Inbox.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedPriorityInbox.map((item, index) => {
                        const id = item?.ID || item?.id;
                        const isRead = viewedIds.includes(id);
                        const catInfo = getCategoryStyles(item?.Type || item?.type);
                        return (
                          <TableRow key={id || index} hover sx={{ opacity: isRead ? 0.6 : 1 }}>
                            <TableCell>
                              <Chip
                                size="small"
                                icon={<Star sx={{ fontSize: "14px !important" }} />}
                                label={`${index + 1}`}
                                color="warning"
                                variant="outlined"
                                sx={{ fontWeight: "bold", height: 22 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: isRead ? 400 : 500 }}>
                                {item?.Message || "No message payload"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item?.Timestamp || "No date"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={catInfo.label}
                                color={catInfo.color}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.75rem" }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                              {getChannelName(id, item?.Message)}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color={isRead ? "default" : "primary"}
                                onClick={() => toggleReadStatus(id)}
                              >
                                {isRead ? <CheckCircle /> : <CheckCircleOutlined />}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  ) : (
                    /* All Notifications Table Rows */
                    notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No notifications found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((item, index) => {
                        const id = item?.ID || item?.id;
                        const isRead = viewedIds.includes(id);
                        const catInfo = getCategoryStyles(item?.Type || item?.type);
                        return (
                          <TableRow key={id || index} hover sx={{ opacity: isRead ? 0.6 : 1 }}>
                            <TableCell>
                              {isRead ? (
                                <Chip label="Read" size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
                              ) : (
                                <Chip label="New" color="error" size="small" sx={{ height: 18, fontSize: "0.7rem", fontWeight: "bold" }} />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: isRead ? 400 : 500 }}>
                                {item?.Message || "No message payload"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item?.Timestamp || "No date"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={catInfo.label}
                                color={catInfo.color}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.75rem" }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                              {getChannelName(id, item?.Message)}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color={isRead ? "default" : "primary"}
                                onClick={() => toggleReadStatus(id)}
                              >
                                {isRead ? <CheckCircle /> : <CheckCircleOutlined />}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Simple Pagination Controls for All Notifications */}
          {!loading && activeTab === 1 && notifications.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  logEvent("info", "state", `Paginated back to page ${page - 1}`);
                }}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Typography variant="body2">Page {page}</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setPage((p) => p + 1);
                  logEvent("info", "state", `Paginated forward to page ${page + 1}`);
                }}
                disabled={notifications.length < limit}
              >
                Next
              </Button>
            </Box>
          )}

          {/* Telemetry Console */}
          <Paper variant="outlined" sx={{ mt: 4, p: 2, bgcolor: "#fff", borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981" }} />
              Logging Middleware Telemetry Output
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Box
              sx={{
                maxHeight: "130px",
                overflowY: "auto",
                bgcolor: "#1e1e1e",
                p: 1.5,
                borderRadius: 1,
                fontFamily: "monospace",
                fontSize: "0.75rem",
              }}
            >
              {telemetryLogs.length === 0 ? (
                <Typography color="text.secondary" variant="caption" sx={{ fontFamily: "monospace", color: "#888" }}>
                  Console idle. Operations trigger real-time log payloads...
                </Typography>
              ) : (
                telemetryLogs.map((log, i) => (
                  <Box key={i} sx={{ mb: 0.5, display: "flex", gap: 1, color: log.level === "error" ? "#f87171" : "#d4d4d8" }}>
                    <span style={{ color: "#71717a" }}>[{log.time}]</span>
                    <span style={{ color: log.level === "error" ? "#ef4444" : "#3b82f6", fontWeight: "bold" }}>
                      {log.level.toUpperCase()}
                    </span>
                    <span style={{ color: "#a1a1aa" }}>({log.package})</span>
                    <span>{log.message}</span>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;