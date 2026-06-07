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
} from "@mui/material";

// Material UI Icon Imports
import {
  Notifications,
  CheckCircle,
  CheckCircleOutlined,
  FilterList,
  Email,
  Sms,
  TouchApp,
  Terminal,
  Refresh,
  Star,
  Info,
  Warning,
  ErrorOutlined,
} from "@mui/icons-material";

// Premium dark mode theme using outfit typography and curated indigo/slate colors
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6366f1", // Indigo
      light: "#818cf8",
      dark: "#4f46e5",
    },
    secondary: {
      main: "#f59e0b", // Gold for priorities
    },
    background: {
      default: "#090d16",
      paper: "#111827",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
    divider: "rgba(255, 255, 255, 0.08)",
  },
  typography: {
    fontFamily: "'Outfit', 'Inter', sans-serif",
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: "none",
        },
      },
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Priority Inbox, 1 = All Notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter States
  const [type, setType] = useState(""); // email, sms, in-app
  const [notificationType, setNotificationType] = useState(""); // Event, Result, Placement
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [topN, setTopN] = useState(10); // Configurable 'n' for Priority Inbox

  // Viewed/Read State (Persisted in localStorage)
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("campus_notifications_viewed_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Telemetry logs displayed live on screen
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  // Save viewed IDs to localStorage
  useEffect(() => {
    localStorage.setItem("campus_notifications_viewed_ids", JSON.stringify(viewedIds));
  }, [viewedIds]);

  // Wrapper for whitelisted Logging Middleware that also updates telemetry state
  const logEvent = async (level, packageName, message) => {
    try {
      const timestamp = new Date().toLocaleTimeString();
      setTelemetryLogs((prev) => [
        { timestamp, level, package: packageName, message },
        ...prev.slice(0, 19), // keep last 20 logs
      ]);
      await Log("frontend", level, packageName, message);
    } catch (err) {
      console.error("Telemetry Logging Error:", err);
    }
  };

  // Log on mount
  useEffect(() => {
    logEvent("info", "component", "Dashboard mounted successfully");
  }, []);

  // Fetch Notifications from test API
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      await logEvent("info", "api", `Requesting notifications (page=${page}, type=${type || 'all'}, category=${notificationType || 'all'})`);

      let url = `http://4.224.186.213/evaluation-service/notifications?page=${page}&limit=50`; // fetch larger pool to sort client side
      if (type) url += `&type=${type}`;
      if (notificationType) url += `&notification_type=${notificationType}`;

      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJoY2hhbm5hbUBnaXRhbS5pbiIsImV4cCI6MTc4MDgxMDU0NiwiaWF0IjoxNzgwODA5NjQ2LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNjUyZjFlZTAtZDExNC00MjBjLTgyMGYtNWY3NGM3NDFmMGU0IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiaGFyaW5pIiwic3ViIjoiMTY1YWZkNTYtMWRiNS00NWZmLWEwZTItZTIxYjkyYjkxNzMzIn0sImVtYWlsIjoiaGNoYW5uYW1AZ2l0YW0uaW4iLCJuYW1lIjoiaGFyaW5pIiwicm9sbE5vIjoiMjAyMzAwMzY2MCIsImFjY2Vzc0NvZGUiOiJ3Z0t0Z1oiLCJjbGllbnRJRCI6IjE2NWFmZDU2LTFkYjUtNDVmZi1hMGUyLWUyMWI5MmI5MTczMyIsImNsaWVudFNlY3JldCI6InJTUnloeW1TRGJoU3pNSlIifQ.MF3NVZkDTRydc2KPxgbMLrzUJiOyBGSo9x33RtMPEDg";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const list = data.notifications || data || [];
      setNotifications(list);

      await logEvent("info", "api", `Fetched ${list.length} notifications successfully`);
    } catch (err) {
      setError(err.message);
      await logEvent("error", "api", `Failed fetching notifications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch on filter/page change
  useEffect(() => {
    fetchNotifications();
  }, [type, notificationType, page]);

  // Tab switch logger
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    logEvent("info", "component", `Switched tab to ${newValue === 0 ? "Priority Inbox" : "All Notifications"}`);
  };

  // Mark notification as viewed
  const toggleViewed = async (id) => {
    const isCurrentlyViewed = viewedIds.includes(id);
    let newViewed;
    if (isCurrentlyViewed) {
      newViewed = viewedIds.filter((item) => item !== id);
      await logEvent("info", "state", `Marked notification ${id} as unread`);
    } else {
      newViewed = [...viewedIds, id];
      await logEvent("info", "state", `Marked notification ${id} as read`);
    }
    setViewedIds(newViewed);
  };

  // Mark all on page as read
  const markAllRead = async () => {
    const unreadIds = notifications
      .map((n) => n.ID || n.id)
      .filter((id) => id && !viewedIds.includes(id));
    
    if (unreadIds.length > 0) {
      setViewedIds((prev) => [...prev, ...unreadIds]);
      await logEvent("info", "state", `Marked all ${unreadIds.length} visible notifications as read`);
    }
  };

  // Priority Inbox sorting algorithm
  // Placement (Weight 3) > Result (Weight 2) > Event (Weight 1).
  // Priority displays unread first, then weight descending, then timestamp descending (recency).
  const prioritySortedNotifications = useMemo(() => {
    const normalized = notifications.map((n) => {
      const typeStr = (n.Type || n.type || "").toLowerCase();
      let weight = 0;
      if (typeStr.includes("placement")) weight = 3;
      else if (typeStr.includes("result")) weight = 2;
      else if (typeStr.includes("event")) weight = 1;

      const isUnread = !viewedIds.includes(n.ID || n.id);
      const timeVal = new Date(n.Timestamp || n.timestamp || 0).getTime();

      return { ...n, _weight: weight, _isUnread: isUnread, _time: timeVal };
    });

    // Sort by unread status, weight descending, then recency descending
    return normalized
      .sort((a, b) => {
        // Unread first
        if (a._isUnread !== b._isUnread) {
          return a._isUnread ? -1 : 1;
        }
        // Weight descending
        if (a._weight !== b._weight) {
          return b._weight - a._weight;
        }
        // Recency descending
        return b._time - a._time;
      })
      .slice(0, topN); // Top N limits
  }, [notifications, viewedIds, topN]);

  // Helper to format timestamps nicely
  const formatTime = (timeStr) => {
    try {
      const d = new Date(timeStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  // Helper to get category icons and colors
  const getCategoryTheme = (category) => {
    const c = (category || "").toLowerCase();
    if (c.includes("placement")) return { label: "Placement", color: "#f59e0b", class: "priority-1" };
    if (c.includes("result")) return { label: "Result", color: "#3b82f6", class: "priority-2" };
    return { label: "Event", color: "#10b981", class: "priority-3" };
  };

  // Helper to get channel icons
  const getChannelIcon = (channel) => {
    const ch = (channel || "").toLowerCase();
    if (ch.includes("email")) return <Email fontSize="small" />;
    if (ch.includes("sms")) return <Sms fontSize="small" />;
    return <TouchApp fontSize="small" />;
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ pb: 8, pt: 4 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Badge color="error" variant="dot" invisible={!notifications.some(n => !viewedIds.includes(n.ID || n.id))}>
                <Box
                  sx={{
                    background: "rgba(99, 102, 241, 0.2)",
                    borderRadius: "12px",
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Notifications color="primary" sx={{ fontSize: 32 }} />
                </Box>
              </Badge>
              <Box>
                <Typography variant="h4" component="h1">
                  Campus Hub
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Observability & Notification Service (Roll No: 2023003660)
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <IconButton
                onClick={fetchNotifications}
                disabled={loading}
                sx={{
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  p: 1.5,
                }}
              >
                <Refresh />
              </IconButton>
            </Box>
          </Box>

          {/* Navigation Tabs */}
          <Paper
            className="glass-card"
            sx={{ mb: 4, background: "rgba(17, 24, 39, 0.5) !important" }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{
                "& .MuiTab-root": { py: 2, fontSize: "1rem", fontWeight: 600 },
              }}
            >
              <Tab label="Priority Inbox" icon={<Star />} iconPosition="start" />
              <Tab label="All Notifications" icon={<FilterList />} iconPosition="start" />
            </Tabs>
          </Paper>

          {/* Filters Bar */}
          <Paper className="glass-card" sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Channel Type</InputLabel>
                  <Select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      logEvent("info", "state", `Changed channel filter to ${e.target.value || 'all'}`);
                    }}
                    label="Channel Type"
                  >
                    <MenuItem value="">All Channels</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                    <MenuItem value="in-app">In-App</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Notification Category</InputLabel>
                  <Select
                    value={notificationType}
                    onChange={(e) => {
                      setNotificationType(e.target.value);
                      logEvent("info", "state", `Changed category filter to ${e.target.value || 'all'}`);
                    }}
                    label="Notification Category"
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
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Show Top 'N'</InputLabel>
                    <Select
                      value={topN}
                      onChange={(e) => {
                        setTopN(Number(e.target.value));
                        logEvent("info", "state", `Changed Priority limit topN to ${e.target.value}`);
                      }}
                      label="Show Top 'N'"
                    >
                      <MenuItem value={5}>Top 5</MenuItem>
                      <MenuItem value={10}>Top 10</MenuItem>
                      <MenuItem value={15}>Top 15</MenuItem>
                      <MenuItem value={20}>Top 20</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              ) : (
                <Grid item xs={12} sm={4} sx={{ display: "flex", gap: 1 }}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Page</InputLabel>
                    <Select
                      value={page}
                      onChange={(e) => {
                        setPage(Number(e.target.value));
                        logEvent("info", "state", `Navigated to page ${e.target.value}`);
                      }}
                      label="Page"
                    >
                      <MenuItem value={1}>Page 1</MenuItem>
                      <MenuItem value={2}>Page 2</MenuItem>
                      <MenuItem value={3}>Page 3</MenuItem>
                      <MenuItem value={4}>Page 4</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="outlined" color="primary" onClick={markAllRead} sx={{ whiteSpace: "nowrap" }}>
                    Mark Visible Read
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Main List */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={48} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 3, mb: 4 }}>
              {error} - Make sure your backend API is online.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {activeTab === 0 ? (
                /* Priority Inbox View */
                prioritySortedNotifications.length === 0 ? (
                  <Grid item xs={12}>
                    <Paper className="glass-card" sx={{ p: 4, textAlign: "center" }}>
                      <Typography color="text.secondary">No priority notifications found.</Typography>
                    </Paper>
                  </Grid>
                ) : (
                  prioritySortedNotifications.map((item, index) => {
                    const cat = getCategoryTheme(item.Type || item.type);
                    const isRead = !item._isUnread;
                    const id = item.ID || item.id;
                    return (
                      <Grid item xs={12} key={id || index} className="animate-fade-in-up">
                        <Card className={`glass-card ${cat.class}`} sx={{ opacity: isRead ? 0.6 : 1 }}>
                          <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
                                <Chip
                                  size="small"
                                  label={`#${index + 1} Priority`}
                                  color="secondary"
                                  icon={<Star sx={{ fontSize: "14px !important" }} />}
                                  sx={{ fontWeight: "bold" }}
                                />
                                <Chip
                                  size="small"
                                  label={cat.label}
                                  sx={{
                                    bgcolor: `${cat.color}22`,
                                    color: cat.color,
                                    borderColor: `${cat.color}44`,
                                    border: "1px solid",
                                    fontWeight: 600,
                                  }}
                                />
                                <Chip
                                  size="small"
                                  label={item.Type || item.type || "In-App"}
                                  icon={getChannelIcon(item.Type || item.type)}
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {formatTime(item.Timestamp || item.timestamp)}
                                </Typography>
                              </Box>

                              <Typography variant="h6" sx={{ fontSize: "1.1rem", mb: 0.5 }}>
                                {item.Message || item.message || "No message payload"}
                              </Typography>
                            </Box>

                            <Box>
                              <Tooltip title={isRead ? "Mark as unread" : "Mark as read"}>
                                <IconButton color={isRead ? "default" : "primary"} onClick={() => toggleViewed(id)}>
                                  {isRead ? <CheckCircle /> : <CheckCircleOutlined />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })
                )
              ) : (
                /* All Notifications View */
                notifications.length === 0 ? (
                  <Grid item xs={12}>
                    <Paper className="glass-card" sx={{ p: 4, textAlign: "center" }}>
                      <Typography color="text.secondary">No notifications found.</Typography>
                    </Paper>
                  </Grid>
                ) : (
                  notifications.map((item, index) => {
                    const cat = getCategoryTheme(item.Type || item.type);
                    const id = item.ID || item.id;
                    const isRead = viewedIds.includes(id);
                    return (
                      <Grid item xs={12} key={id || index} className="animate-fade-in-up">
                        <Card className={`glass-card ${cat.class}`} sx={{ opacity: isRead ? 0.6 : 1 }}>
                          <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
                                {!isRead && <span className="unread-badge" />}
                                <Chip
                                  size="small"
                                  label={cat.label}
                                  sx={{
                                    bgcolor: `${cat.color}22`,
                                    color: cat.color,
                                    borderColor: `${cat.color}44`,
                                    border: "1px solid",
                                    fontWeight: 600,
                                  }}
                                />
                                <Chip
                                  size="small"
                                  label={item.Type || item.type || "In-App"}
                                  icon={getChannelIcon(item.Type || item.type)}
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {formatTime(item.Timestamp || item.timestamp)}
                                </Typography>
                              </Box>

                              <Typography variant="h6" sx={{ fontSize: "1.1rem", mb: 0.5 }}>
                                {item.Message || item.message || "No message payload"}
                              </Typography>
                            </Box>

                            <Box>
                              <Tooltip title={isRead ? "Mark as unread" : "Mark as read"}>
                                <IconButton color={isRead ? "default" : "primary"} onClick={() => toggleViewed(id)}>
                                  {isRead ? <CheckCircle /> : <CheckCircleOutlined />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })
                )
              )}
            </Grid>
          )}

          {/* Telemetry Console */}
          <Paper className="glass-card" sx={{ mt: 5, p: 3, background: "rgba(15, 23, 42, 0.6) !important" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Terminal color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Logging Middleware Live Telemetry Console
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                maxHeight: "150px",
                overflowY: "auto",
                bgcolor: "#030712",
                p: 2,
                borderRadius: 2,
                fontFamily: "monospace",
                fontSize: "0.85rem",
              }}
            >
              {telemetryLogs.length === 0 ? (
                <Typography color="text.secondary" variant="body2" sx={{ fontFamily: "monospace" }}>
                  Telemetry idle. Trigger operations to view real-time log payloads...
                </Typography>
              ) : (
                telemetryLogs.map((log, i) => (
                  <Box key={i} sx={{ mb: 1, display: "flex", gap: 2, alignItems: "flex-start" }}>
                    <Typography component="span" sx={{ color: "#94a3b8", fontSize: "inherit", fontFamily: "inherit" }}>
                      [{log.timestamp}]
                    </Typography>
                    <Chip
                      size="small"
                      label={log.level}
                      color={log.level === "error" ? "error" : "primary"}
                      sx={{
                        fontSize: "0.7rem",
                        height: 18,
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    />
                    <Chip
                      size="small"
                      label={log.package}
                      variant="outlined"
                      sx={{
                        fontSize: "0.7rem",
                        height: 18,
                        borderColor: "rgba(255,255,255,0.2)",
                      }}
                    />
                    <Typography component="span" sx={{ color: log.level === "error" ? "#f87171" : "#f3f4f6", fontSize: "inherit", fontFamily: "inherit" }}>
                      {log.message}
                    </Typography>
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