import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout';
import { TaskCard, Task } from '@/components/tasks';
import { NoticeCard, Notice } from '@/components/notices';
import { supabase } from '@/lib/supabase';
import { Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState<{ tasks: Task[], notices: Notice[] }>({ tasks: [], notices: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) return;
            setLoading(true);
            try {
                const [taskRes, noticeRes] = await Promise.all([
                    supabase.from('tasks').select('*, profiles:assigned_to(name)').or(`title.ilike.%${query}%,description.ilike.%${query}%`),
                    supabase.from('notices').select('*, profiles:author_id(name, role)').or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                ]);

                const formattedTasks: Task[] = (taskRes.data || []).map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status === 'in-progress' ? 'in_progress' : t.status,
                    priority: t.priority,
                    assignee: { name: t.profiles?.name || 'Unassigned' },
                    dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'TBD',
                    createdAt: t.created_at
                }));

                const formattedNotices: Notice[] = (noticeRes.data || []).map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    content: n.content,
                    type: n.type,
                    author: { name: n.profiles?.name || 'Admin', role: n.profiles?.role || 'Admin' },
                    createdAt: new Date(n.created_at).toLocaleDateString(),
                    isPinned: n.is_pinned
                }));

                setResults({ tasks: formattedTasks, notices: formattedNotices });
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    const totalResults = results.tasks.length + results.notices.length;

    return (
        <div className="min-h-screen">
            <Header title="Search Results" />
            <div className="p-8 sm:p-12 space-y-10">
                <div>
                    <h1 className="text-2xl font-black text-[#212B36] tracking-tight">
                        Search results for "{query}"
                    </h1>
                    <p className="text-sm font-semibold text-muted-foreground/60 mt-1 uppercase tracking-wider">
                        {loading ? 'Searching...' : `${totalResults} results found`}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    </div>
                ) : totalResults === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-secondary/50 flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground mb-2">No results found</h2>
                        <p className="text-muted-foreground">
                            Try adjusting your search terms or filters to find what you're looking for.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {results.tasks.length > 0 && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-black text-foreground uppercase tracking-widest">Tasks</h2>
                                    <Badge variant="secondary">{results.tasks.length}</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {results.tasks.map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {results.notices.length > 0 && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-black text-foreground uppercase tracking-widest">Notices</h2>
                                    <Badge variant="secondary">{results.notices.length}</Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {results.notices.map(notice => (
                                        <NoticeCard key={notice.id} notice={notice} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResultsPage;
