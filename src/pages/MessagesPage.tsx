import React from 'react';
import { Header } from '@/components/layout';
import { MessageSquare } from 'lucide-react';

const MessagesPage: React.FC = () => {
    return (
        <div className="min-h-screen">
            <Header title="Messages" subtitle="Connect with your team in real-time" />
            <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                    <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-foreground mb-2">Coming Soon</h2>
                <p className="text-muted-foreground max-w-md">
                    We're working hard to bring you a seamless real-time chat experience. Stay tuned for updates!
                </p>
            </div>
        </div>
    );
};

export default MessagesPage;
