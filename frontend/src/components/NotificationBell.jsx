import React, { useCallback, useEffect, useState } from "react";

const POLLING_INTERVAL = 10000;

const getReadStorageKey = (userRole) =>
  `ssgi_notification_read_${encodeURIComponent(userRole || "unknown")}`;

const getNotificationId = (notification) => {
  const id = Number(notification?.id);
  return Number.isFinite(id) ? id : 0;
};

const getReadNotificationIds = (userRole) => {
  try {
    const stored = localStorage.getItem(getReadStorageKey(userRole));

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed.map(Number).filter((id) => Number.isFinite(id))
      : [];
  } catch (error) {
    console.error("Failed to read notification read states", error);
    return [];
  }
};

const NotificationBell = ({
  token,
  userRole,
  onClick,
  title = "Notifications",
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchUnreadCount = useCallback(async () => {
    if (!token || !userRole) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch(
        `${apiUrl}/api/notifications?role=${encodeURIComponent(userRole)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      const notifications = Array.isArray(data) ? data : [];

      const readNotificationIds = getReadNotificationIds(userRole);

      const unread = notifications.filter((notification) => {
        const notificationId = getNotificationId(notification);

        return (
          notificationId > 0 && !readNotificationIds.includes(notificationId)
        );
      }).length;

      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to check notification count", err);
    }
  }, [apiUrl, token, userRole]);

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  /*
   * Listen for notification read-state changes from
   * NotificationCenter.jsx.
   *
   * This makes the bell count update immediately instead
   * of waiting for the 10-second polling interval.
   */
  useEffect(() => {
    const handleNotificationReadStateChange = (event) => {
      if (event?.detail?.userRole && event.detail.userRole !== userRole) {
        return;
      }

      fetchUnreadCount();
    };

    window.addEventListener(
      "ssgi-notification-read-state-changed",
      handleNotificationReadStateChange,
    );

    return () => {
      window.removeEventListener(
        "ssgi-notification-read-state-changed",
        handleNotificationReadStateChange,
      );
    };
  }, [fetchUnreadCount, userRole]);

  /*
   * Clicking the bell only opens the notification center.
   *
   * It does NOT mark notifications as read.
   * A notification becomes read only when the user presses
   * "Mark as Read" on that specific notification.
   */
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      aria-label={
        unreadCount > 0
          ? `${title}. ${unreadCount} unread notification${
              unreadCount === 1 ? "" : "s"
            }`
          : title
      }
      style={{
        position: "relative",
        width: "42px",
        height: "42px",
        minWidth: "42px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: "transparent",
        color: "inherit",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <svg
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "1px",
            right: "0px",
            minWidth: "18px",
            height: "18px",
            padding: "0 5px",
            borderRadius: "999px",
            backgroundColor: "#dc2626",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "700",
            lineHeight: "18px",
            textAlign: "center",
            border: "2px solid currentColor",
            boxSizing: "border-box",
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
