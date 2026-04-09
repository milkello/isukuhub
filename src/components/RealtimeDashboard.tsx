"use client"

import { useState, useEffect } from "react"
import { useCollectionUpdates, useTransactionUpdates, usePriceUpdates } from "@/hooks/useRealtime"
import { Activity, TrendingUp, Package, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface LiveStats {
  totalCollections: number
  activeCollections: number
  completedCollections: number
  totalRevenue: number
  recentTransactions: any[]
  recentCollections: any[]
  priceUpdates: any[]
}

export default function RealtimeDashboard() {
  const collectionUpdates = useCollectionUpdates()
  const transactionUpdates = useTransactionUpdates()
  const priceUpdates = usePriceUpdates()
  const [stats, setStats] = useState<LiveStats>({
    totalCollections: 0,
    activeCollections: 0,
    completedCollections: 0,
    totalRevenue: 0,
    recentTransactions: [],
    recentCollections: [],
    priceUpdates: []
  })

  useEffect(() => {
    // Update stats based on real-time events
    const activeCollections = collectionUpdates.filter(c => c.status === 'in_progress').length
    const completedCollections = collectionUpdates.filter(c => c.status === 'completed').length
    const totalRevenue = transactionUpdates
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)

    setStats(prev => ({
      ...prev,
      totalCollections: collectionUpdates.length,
      activeCollections,
      completedCollections,
      totalRevenue,
      recentTransactions: transactionUpdates.slice(-5).reverse(),
      recentCollections: collectionUpdates.slice(-5).reverse(),
      priceUpdates: priceUpdates.slice(-3).reverse()
    }))
  }, [collectionUpdates, transactionUpdates, priceUpdates])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="space-y-6">
      {/* Live Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Collections</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalCollections}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Collections</p>
              <p className="text-2xl font-bold text-slate-800">{stats.activeCollections}</p>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Completed</p>
              <p className="text-2xl font-bold text-slate-800">{stats.completedCollections}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Live Updates Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Collections */}
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Collections</h3>
          <div className="space-y-3">
            {stats.recentCollections.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No recent collections</p>
            ) : (
              stats.recentCollections.map((collection) => (
                <div key={collection.collectionId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(collection.status)}
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Collection #{collection.collectionId.slice(-6)}
                      </p>
                      <p className="text-xs text-slate-500">{formatTime(collection.timestamp)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    collection.status === 'completed' ? 'bg-green-100 text-green-700' :
                    collection.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {collection.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {stats.recentTransactions.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No recent transactions</p>
            ) : (
              stats.recentTransactions.map((transaction) => (
                <div key={transaction.transactionId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </p>
                    <p className="text-xs text-slate-500">{formatTime(transaction.timestamp)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Price Updates */}
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Price Updates</h3>
          <div className="space-y-3">
            {stats.priceUpdates.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No recent price updates</p>
            ) : (
              stats.priceUpdates.map((priceUpdate) => (
                <div key={`${priceUpdate.materialId}-${priceUpdate.timestamp}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{priceUpdate.materialName}</p>
                    <p className="text-xs text-slate-500">{formatTime(priceUpdate.timestamp)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(priceUpdate.newPrice)}
                    </p>
                    <span className={`text-xs font-medium ${
                      priceUpdate.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {priceUpdate.change >= 0 ? '+' : ''}{priceUpdate.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>Live updates active</span>
      </div>
    </div>
  )
}
