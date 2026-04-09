"use client"

import { useState } from "react"
import { useSystemNotifications } from "@/hooks/useRealtime"
import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react"

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  timestamp: string
  read: boolean
}

export default function RealtimeNotifications() {
  const notifications = useSystemNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [readIds, setReadIds] = useState<string[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  const notificationItems: NotificationItem[] = notifications
    .map((notif, index) => ({
      id: `${notif.timestamp}-${notif.title}-${index}`,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      timestamp: notif.timestamp,
      read: readIds.includes(`${notif.timestamp}-${notif.title}-${index}`)
    }))
    .filter((item) => !dismissedIds.includes(item.id))
    .slice(-50)
    .reverse()

  const unreadCount = notificationItems.filter((item) => !item.read).length

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getBgColor = (type: NotificationItem["type"]) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const markAsRead = (id: string) => {
    setReadIds((previousIds) =>
      previousIds.includes(id) ? previousIds : [...previousIds, id],
    )
  }

  const markAllAsRead = () => {
    setReadIds((previousIds) => {
      const nextIds = new Set(previousIds)
      for (const notification of notificationItems) {
        nextIds.add(notification.id)
      }
      return Array.from(nextIds)
    })
  }

  const clearNotifications = () => {
    setDismissedIds((previousIds) => {
      const nextIds = new Set(previousIds)
      for (const notification of notificationItems) {
        nextIds.add(notification.id)
      }
      return Array.from(nextIds)
    })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={clearNotifications}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificationItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notificationItems.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${getBgColor(notification.type)} border-l-4 ${
                      !notification.read ? 'font-medium' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {notification.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
}
