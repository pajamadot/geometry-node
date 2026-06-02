import React, { useCallback, useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Clock, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { listProjects, createProject, type Project } from '../lib/projectsApi';

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function ProjectsGrid() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listProjects(getToken);
      setProjects(rows);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleNew = useCallback(async () => {
    const raw = window.prompt('Project name', 'Untitled');
    // User cancelled
    if (raw === null) return;
    const name = raw.trim() || 'Untitled';
    setCreating(true);
    try {
      const project = await createProject(name, getToken);
      navigate(`/editor/${project.id}`);
    } catch (err) {
      alert(`Failed to create project: ${String(err)}`);
    } finally {
      setCreating(false);
    }
  }, [getToken, navigate]);

  const handleOpen = useCallback(
    (id: string) => {
      navigate(`/editor/${id}`);
    },
    [navigate],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 text-gray-400 animate-spin" />
        <span className="ml-3 text-gray-400 text-sm">Loading projects…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="size-8 text-red-400" />
        <p className="text-red-400 text-sm text-center max-w-md">{error}</p>
        <button
          onClick={load}
          className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {projects.length === 0 ? 'No projects yet' : `${projects.length} project${projects.length === 1 ? '' : 's'}`}
        </p>
        <button
          onClick={handleNew}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all duration-200"
        >
          {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          New project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-gray-700 rounded-xl">
          <FolderOpen className="size-10 text-gray-600" />
          <p className="text-gray-500 text-sm">Create your first project to get started.</p>
          <button
            onClick={handleNew}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all duration-200"
          >
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            New project
          </button>
        </div>
      )}

      {/* Project grid */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleOpen(project.id)}
              className="group text-left p-5 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl transition-all duration-200 hover:bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {/* Icon */}
              <div className="mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/20 flex items-center justify-center">
                  <FolderOpen className="size-5 text-purple-400" />
                </div>
              </div>

              {/* Name */}
              <h3 className="text-white font-medium text-sm truncate mb-1 group-hover:text-purple-300 transition-colors">
                {project.name}
              </h3>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDate(project.updatedAt)}
                </span>
                <span className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">v{project.version}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectPicker() {
  return (
    <div className="min-h-screen bg-gray-950 text-white pt-16">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-white mb-2">Projects</h1>
          <p className="text-gray-400 text-sm">Select a project to open in the editor, or create a new one.</p>
        </div>

        <SignedOut>
          <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-gray-700 rounded-xl">
            <LogIn className="size-10 text-gray-500" />
            <p className="text-gray-400 text-sm">Sign in to view your projects.</p>
            <SignInButton mode="modal">
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200">
                <LogIn className="size-4" />
                Sign in
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <ProjectsGrid />
        </SignedIn>
      </div>
    </div>
  );
}
