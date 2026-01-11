import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";

interface OrderNote {
  id: string;
  order_id: string;
  user_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  user_name: string | null;
}

interface OrderNotesPanelProps {
  orderId: string;
}

export function OrderNotesPanel({ orderId }: OrderNotesPanelProps) {
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchNotes();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-notes-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_notes",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [orderId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("order_notes")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const notesData = (data as OrderNote[]) || [];
      setNotes(notesData);

      // Fetch user profiles for note authors from the profiles table
      const userIds = [...new Set(notesData.map((note) => note.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name")
          .in("user_id", userIds);

        const profileMap = new Map<string, string>();
        (profiles || []).forEach((profile) => {
          profileMap.set(profile.user_id, profile.name || "Unknown User");
        });
        setUserProfiles(profileMap);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("order_notes").insert({
        order_id: orderId,
        note: newNote.trim(),
        user_id: currentUserId,
      });

      if (error) throw error;

      setNewNote("");
      toast.success("Note added");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("order_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Internal Notes</h3>
        <Badge variant="secondary">{notes.length}</Badge>
      </div>

      {/* Notes List */}
      {notes.length > 0 ? (
        <ScrollArea className="h-[300px] rounded-lg border p-4">
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-muted/50 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {userProfiles.get(note.user_id) || "Unknown User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {note.user_id === currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-auto p-1"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.note}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">
          No notes yet. Add the first note below.
        </div>
      )}

      {/* Add Note Form */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add an internal note about this order..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSubmitNote();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Press Ctrl+Enter to send
          </span>
          <Button
            onClick={handleSubmitNote}
            disabled={submitting || !newNote.trim()}
            size="sm"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Add Note
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
