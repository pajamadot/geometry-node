import React, { useState, useEffect } from 'react';
import { 
  Users, Share2, MessageCircle, Bell, Star, Download, 
  Eye, Heart, Clock, TrendingUp, Award, Zap, Database 
} from 'lucide-react';
import { useAuth } from './UserAuthProvider';
import { SerializableNodeDefinition } from '../types/nodeSystem';
import { useNodeDatabase } from '../hooks/useNodeDatabase';

interface CollaborationHubProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeSelected: (nodeType: string) => void;
}

interface Activity {
  id: string;
  type: 'node_created' | 'node_shared' | 'node_liked' | 'user_joined' | 'graph_shared';
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  target?: {
    name: string;
    type: string;
  };
  timestamp: string;
}

interface CommunityStats {
  totalUsers: number;
  activeUsers: number;
  nodesShared: number;
  collaborations: number;
}

export default function CollaborationHub({ isOpen, onClose, onNodeSelected }: CollaborationHubProps) {
  const { user } = useAuth();
  const { nodes, searchNodes } = useNodeDatabase(user?.id);
  const [activeTab, setActiveTab] = useState<'activity' | 'trending' | 'community' | 'my-shares'>('activity');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trendingNodes, setTrendingNodes] = useState<SerializableNodeDefinition[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    totalUsers: 1247,
    activeUsers: 89,
    nodesShared: 3492,
    collaborations: 156
  });

  // Mock real-time activities
  useEffect(() => {
    if (!isOpen) return;

    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'node_created',
        user: {
          id: 'user1',
          username: 'TerrainMaster',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TerrainMaster'
        },
        target: { name: 'Advanced Erosion', type: 'erosion-simulator' },
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'node_shared',
        user: {
          id: 'user2',
          username: 'GeometryWiz',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GeometryWiz'
        },
        target: { name: 'Organic Growth', type: 'organic-growth' },
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'user_joined',
        user: {
          id: 'user3',
          username: 'NewDesigner',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewDesigner'
        },
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'node_liked',
        user: {
          id: 'user4',
          username: 'ArchViz_Pro',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArchViz_Pro'
        },
        target: { name: 'Neural Mesh Optimizer', type: 'neural-optimizer' },
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ];

    setActivities(mockActivities);

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every 5 seconds
        const newActivity: Activity = {
          id: Date.now().toString(),
          type: ['node_created', 'node_shared', 'node_liked'][Math.floor(Math.random() * 3)] as any,
          user: {
            id: `user${Math.floor(Math.random() * 1000)}`,
            username: `User${Math.floor(Math.random() * 1000)}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
          },
          target: {
            name: ['Advanced Generator', 'Custom Tool', 'Magic Node'][Math.floor(Math.random() * 3)],
            type: 'custom-node'
          },
          timestamp: new Date().toISOString()
        };
        
        setActivities(prev => [newActivity, ...prev].slice(0, 20));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'node_created': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'node_shared': return <Share2 className="w-4 h-4 text-blue-500" />;
      case 'node_liked': return <Heart className="w-4 h-4 text-red-500" />;
      case 'user_joined': return <Users className="w-4 h-4 text-green-500" />;
      case 'graph_shared': return <Database className="w-4 h-4 text-orange-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'node_created':
        return `created "${activity.target?.name}"`;
      case 'node_shared':
        return `shared "${activity.target?.name}"`;
      case 'node_liked':
        return `liked "${activity.target?.name}"`;
      case 'user_joined':
        return 'joined the community';
      case 'graph_shared':
        return `shared a graph with "${activity.target?.name}"`;
      default:
        return 'performed an action';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Collaboration Hub</h2>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>{communityStats.activeUsers} online</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{communityStats.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{communityStats.activeUsers}</div>
              <div className="text-xs text-gray-500">Active Now</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{communityStats.nodesShared.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Nodes Shared</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{communityStats.collaborations}</div>
              <div className="text-xs text-gray-500">Collaborations</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'activity', label: 'Live Activity', icon: Bell },
              { id: 'trending', label: 'Trending', icon: TrendingUp },
              { id: 'community', label: 'Community', icon: Users },
              { id: 'my-shares', label: 'My Shares', icon: Share2 }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Live Community Activity
              </h3>
              
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                    <img
                      src={activity.user.avatar}
                      alt={activity.user.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        {getActivityIcon(activity.type)}
                        <span className="font-medium">{activity.user.username}</span>
                        <span className="text-gray-600">{getActivityText(activity)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                    {activity.target && (
                      <button
                        onClick={() => onNodeSelected(activity.target!.type)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Use
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'trending' && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trending This Week
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'AI Terrain Generator', author: 'TerrainMaster', downloads: 1547, trend: '+25%' },
                  { name: 'Neural Mesh Optimizer', author: 'NeuralLabs', downloads: 892, trend: '+45%' },
                  { name: 'Organic Growth Pattern', author: 'BioDesigner', downloads: 634, trend: '+15%' },
                  { name: 'Procedural City Builder', author: 'UrbanPlanner', downloads: 421, trend: '+35%' }
                ].map((node, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{node.name}</h4>
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        {node.trend}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">by {node.author}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {node.downloads.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          4.8
                        </span>
                      </div>
                      <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                        Install
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Community Contributors
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { username: 'TerrainMaster', nodes: 23, downloads: 15420, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TerrainMaster', badge: 'Expert' },
                  { username: 'GeometryWiz', nodes: 18, downloads: 8930, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GeometryWiz', badge: 'Pro' },
                  { username: 'NeuralLabs', nodes: 12, downloads: 12400, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NeuralLabs', badge: 'AI Expert' },
                  { username: 'ArchViz_Pro', nodes: 31, downloads: 6780, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArchViz_Pro', badge: 'Architect' }
                ].map((contributor, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={contributor.avatar}
                        alt={contributor.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{contributor.username}</div>
                        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full inline-block">
                          {contributor.badge}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center text-sm">
                      <div>
                        <div className="font-semibold text-purple-600">{contributor.nodes}</div>
                        <div className="text-xs text-gray-500">Nodes</div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-600">{contributor.downloads.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Downloads</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'my-shares' && user && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                My Shared Nodes
              </h3>
              
              <div className="space-y-3">
                {nodes.filter(node => node.author === user.id && node.isPublic).map(node => (
                  <div key={node.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{node.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{node.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Created {new Date(node.createdAt || '').toLocaleDateString()}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {Math.floor(Math.random() * 500)} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {Math.floor(Math.random() * 100)} downloads
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                          Edit
                        </button>
                        <button
                          onClick={() => onNodeSelected(node.type)}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {nodes.filter(node => node.author === user.id && node.isPublic).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Share2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>You haven't shared any nodes yet</p>
                    <p className="text-sm mt-1">Create and share nodes to build your reputation in the community!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 