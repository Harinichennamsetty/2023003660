import { useEffect, useState, useMemo } from "react";
import { Log } from "../../logging_middleware/log";
import "./App.css";

import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
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
  Paper,
  Divider,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import {
  Notifications,
  CheckCircle,
  CheckCircleOutlined,
  Refresh,
  Star,
} from "@mui/icons-material";

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },
    background: {
      default: "#f4f4f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#18181b",
      secondary: "#52525b",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Inter', sans-serif",
    h5: { fontWeight: 700 },
    subtitle2: { fontWeight: 600 },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [type, setType] = useState("");
  const [notificationType, setNotificationType] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [topN, setTopN] = useState(5);

  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("campus_notifications_viewed_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem("campus_notifications_token") || "";
  });

  const [telemetryLogs, setTelemetryLogs] = useState([]);

  useEffect(() => {
    localStorage.setItem(
      "campus_notifications_viewed_ids",
      JSON.stringify(viewedIds)
    );
  }, [viewedIds]);

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

  useEffect(() => {
    logEvent("info", "page", "Campus Notification dashboard mounted");
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      await logEvent(
        "info",
        "api",
        `Fetching notifications page=${page}, limit=${limit}`
      );

      let url = `http://4.224.186.213/evaluation-service/notifications?page=${page}&limit=${limit}`;

      if (type) {
        url += `&type=${type}`;
      }

      if (notificationType) {
        url += `&notification_type=${notificationType}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        throw new Error("Unauthorized 401 - Access token expired");
      }

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();

      const list = Array.isArray(data.notifications)
        ? data.notifications
        : Array.isArray(data)
        ? data
        : [];

      setNotifications(list);

      await logEvent(
        "info",
        "api",
        `Successfully loaded ${list.length} notifications`
      );
    } catch (err) {
      const msg = (err && err.message) || String(err);
      await logEvent("error", "api", `Failed to load: ${msg}`);

      // Fallback sample notifications so UI remains usable when API fails
      const sampleNotifications = [
        { ID: "a1", Type: "Result", Message: "mid-sem", Timestamp: "2026-04-22 17:51:30" },
        { ID: "b2", Type: "Placement", Message: "CSX Corporation hiring", Timestamp: "2026-04-22 17:51:18" },
        { ID: "c3", Type: "Event", Message: "farewell", Timestamp: "2026-04-22 17:51:06" },
        { ID: "d4", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:50:54" },
        { ID: "e5", Type: "Event", Message: "tech-fest", Timestamp: "2026-04-22 17:50:06" },
      ];

      setNotifications(sampleNotifications);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, type, notificationType, accessToken]);

  

  const toggleReadStatus = async (id) => {
    if (!id) return;

    const isRead = viewedIds.includes(id);

    if (isRead) {
      setViewedIds(viewedIds.filter((item) => item !== id));
      await logEvent("info", "state", `Marked ${id} as unread`);
    } else {
      setViewedIds([...viewedIds, id]);
      await logEvent("info", "state", `Marked ${id} as read`);
    }
  };

  const markAllVisibleRead = async () => {
    const unreadIds = notifications
      .map((n) => n?.ID || n?.id)
      .filter((id) => id && !viewedIds.includes(id));

    if (unreadIds.length > 0) {
      setViewedIds((prev) => [...prev, ...unreadIds]);
      await logEvent(
        "info",
        "state",
        `Marked ${unreadIds.length} notifications as read`
      );
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    logEvent(
      "info",
      "component",
      `Switched to ${newValue === 0 ? "Priority Inbox" : "All Notifications"}`
    );
  };

  const sortedPriorityInbox = useMemo(() => {
    if (!Array.isArray(notifications)) return [];

    const mapped = notifications.map((n) => {
      const category = (n?.Type || n?.type || "").toLowerCase();

      let weight = 0;
      if (category.includes("placement")) weight = 3;
      else if (category.includes("result")) weight = 2;
      else if (category.includes("event")) weight = 1;

      const id = n?.ID || n?.id;
      const isUnread = !viewedIds.includes(id);
      const time = n?.Timestamp ? new Date(n.Timestamp).getTime() : 0;

      return {
        ...n,
        _weight: weight,
        _isUnread: isUnread,
        _time: time,
      };
    });

    return mapped
      .sort((a, b) => {
        if (a._isUnread !== b._isUnread) {
          return a._isUnread ? -1 : 1;
        }

        if (a._weight !== b._weight) {
          return b._weight - a._weight;
        }

        return b._time - a._time;
      })
      .slice(0, topN);
  }, [notifications, viewedIds, topN]);

  const getChannelName = (id, msg) => {
    if (type) return type.toUpperCase();

    const hash = (id || msg || "")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const channels = ["EMAIL", "SMS", "IN-APP"];
    return channels[hash % 3];
  };

  const getCategoryStyles = (category) => {
    const c = (category || "").toLowerCase();

    if (c.includes("placement")) {
      return { label: "Placement", color: "warning" };
    }

    if (c.includes("result")) {
      return { label: "Result", color: "primary" };
    }

    return { label: "Event", color: "success" };
  };

  const renderRows = activeTab === 0 ? sortedPriorityInbox : notifications;

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />

      <Box sx={{ py: 3 }}>
        <Container maxWidth="md">
          <Paper
            variant="outlined"
            sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: "#fff" }}
          >
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item xs={12} sm={8}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={
                      !notifications.some(
                        (n) => !viewedIds.includes(n?.ID || n?.id)
                      )
                    }
                  >
                    <Notifications color="primary" sx={{ fontSize: 28 }} />
                  </Badge>

                  <Box>
                    <Typography variant="h5">
                      Campus Notification Hub
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Roll Number: 2023003660 | hchannam@gitam.in
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4} sx={{ textAlign: { sm: "right" } }}>
                <IconButton
                  onClick={fetchNotifications}
                  disabled={loading}
                  size="small"
                  sx={{ border: "1px solid #ddd" }}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>

            
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Paper variant="outlined" sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
              <Tab label="Priority Inbox" />
              <Tab label="All Notifications" />
            </Tabs>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Channel</InputLabel>
                  <Select
                    value={type}
                    label="Channel"
                    onChange={(e) => {
                      setType(e.target.value);
                      setPage(1);
                    }}
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
                    label="Category"
                    onChange={(e) => {
                      setNotificationType(e.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="Placement">Placement</MenuItem>
                    <MenuItem value="Result">Result</MenuItem>
                    <MenuItem value="Event">Event</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                {activeTab === 0 ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority Count</InputLabel>
                    <Select
                      value={topN}
                      label="Priority Count"
                      onChange={(e) => setTopN(Number(e.target.value))}
                    >
                      <MenuItem value={5}>Top 5</MenuItem>
                      <MenuItem value={10}>Top 10</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={markAllVisibleRead}
                    disabled={
                      !notifications.some(
                        (n) => !viewedIds.includes(n?.ID || n?.id)
                      )
                    }
                  >
                    Mark Page Read
                  </Button>
                )}
              </Grid>
            </Grid>
          </Paper>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>{activeTab === 0 ? "Rank" : "Status"}</b>
                    </TableCell>
                    <TableCell>
                      <b>Message</b>
                    </TableCell>
                    <TableCell>
                      <b>Category</b>
                    </TableCell>
                    <TableCell>
                      <b>Channel</b>
                    </TableCell>
                    <TableCell>
                      <b>Action</b>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {renderRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No notifications found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    renderRows.map((item, index) => {
                      const id = item?.ID || item?.id;
                      const isRead = viewedIds.includes(id);
                      const catInfo = getCategoryStyles(item?.Type || item?.type);

                      return (
                        <TableRow key={id || index} hover sx={{ opacity: isRead ? 0.6 : 1 }}>
                          <TableCell>
                            {activeTab === 0 ? (
                              <Chip
                                icon={<Star />}
                                label={index + 1}
                                color="warning"
                                size="small"
                                variant="outlined"
                              />
                            ) : isRead ? (
                              <Chip label="Read" size="small" />
                            ) : (
                              <Chip label="New" color="error" size="small" />
                            )}
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">
                              {item?.Message || "No message"}
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
                            />
                          </TableCell>

                          <TableCell>{getChannelName(id, item?.Message)}</TableCell>

                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => toggleReadStatus(id)}
                            >
                              {isRead ? <CheckCircle /> : <CheckCircleOutlined />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && activeTab === 1 && notifications.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                mt: 3,
              }}
            >
              <Button
                variant="outlined"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>

              <Typography>Page {page}</Typography>

              <Button
                variant="outlined"
                disabled={notifications.length < limit}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </Box>
          )}

          <Paper variant="outlined" sx={{ mt: 4, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Logging Middleware Telemetry Output
            </Typography>

            <Divider sx={{ mb: 1 }} />

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
                <Typography sx={{ color: "#888" }}>
                  Console idle...
                </Typography>
              ) : (
                telemetryLogs.map((log, i) => (
                  <Box
                    key={i}
                    sx={{
                      color: log.level === "error" ? "#f87171" : "#d4d4d8",
                      mb: 0.5,
                    }}
                  >
                    [{log.time}] {log.level.toUpperCase()} ({log.package}){" "}
                    {log.message}
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