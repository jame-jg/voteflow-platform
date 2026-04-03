import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, X, Loader2, Upload, Save, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES } from "@/lib/currency";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ExistingContestant {
  id: string;
  name: string;
  bio: string | null;
  category: string | null;
  code: string | null;
  photo_url: string | null;
  vote_count: number;
  _dirty?: boolean;
}

interface NewContestant {
  name: string;
  bio: string;
  category: string;
  code: string;
  photo: File | null;
  photoPreview: string;
}

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pricePerVote, setPricePerVote] = useState("100");
  const [currency, setCurrency] = useState("NGN");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");

  const [existingContestants, setExistingContestants] = useState<ExistingContestant[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [newContestants, setNewContestants] = useState<NewContestant[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    if (!id) return;

    const load = async () => {
      const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
      if (!event || event.organizer_id !== user.id) {
        toast({ title: "Access denied", variant: "destructive" });
        navigate("/organizer");
        return;
      }
      setTitle(event.title);
      setDescription(event.description || "");
      setCategory(event.category || "");
      setPricePerVote(String(event.price_per_vote));
      setCurrency(event.currency);
      setStartDate(event.start_date ? event.start_date.slice(0, 16) : "");
      setEndDate(event.end_date ? event.end_date.slice(0, 16) : "");
      setBannerUrl(event.banner_url);
      setBannerPreview(event.banner_url || "");

      const { data: contestants } = await supabase
        .from("contestants").select("*").eq("event_id", id).order("created_at", { ascending: true });
      setExistingContestants((contestants || []).map(c => ({ ...c, _dirty: false } as ExistingContestant)));
      setLoading(false);
    };
    load();
  }, [user, authLoading, id]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setNewBanner(file); setBannerPreview(URL.createObjectURL(file)); }
  };

  const updateExisting = (idx: number, field: "name" | "bio" | "category" | "code", value: string) => {
    setExistingContestants(prev => prev.map((c, i) =>
      i === idx ? { ...c, [field]: value || null, _dirty: true } : c
    ));
  };

  const removeExisting = (idx: number) => {
    const c = existingContestants[idx];
    setRemovedIds(prev => [...prev, c.id]);
    setExistingContestants(prev => prev.filter((_, i) => i !== idx));
  };

  const addNew = () => setNewContestants(prev => [...prev, { name: "", bio: "", category: "", code: "", photo: null, photoPreview: "" }]);
  const removeNew = (idx: number) => setNewContestants(prev => prev.filter((_, i) => i !== idx));
  const updateNew = (idx: number, field: "name" | "bio" | "category" | "code", value: string) => {
    setNewContestants(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const handleNewPhoto = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewContestants(prev => prev.map((c, i) =>
        i === idx ? { ...c, photo: file, photoPreview: URL.createObjectURL(file) } : c
      ));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const ext = file.name.split(".").pop();
    const fileName = `${path}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("event-assets").upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from("event-assets").getPublicUrl(fileName).data.publicUrl;
  };

  const handleSave = async () => {
    if (!id || !user) return;
    setSaving(true);
    try {
      let finalBannerUrl = bannerUrl;
      if (newBanner) finalBannerUrl = await uploadFile(newBanner, "banners");

      const { error: eventErr } = await supabase.from("events").update({
        title, description: description || null, category: category || null,
        price_per_vote: parseInt(pricePerVote) || 100, currency,
        start_date: startDate || null, end_date: endDate || null,
        banner_url: finalBannerUrl,
      }).eq("id", id);
      if (eventErr) throw eventErr;

      for (const cid of removedIds) {
        await supabase.from("contestants").delete().eq("id", cid);
      }

      for (const c of existingContestants) {
        if (c._dirty) {
          await supabase.from("contestants").update({
            name: c.name, bio: c.bio, category: c.category, code: c.code,
          }).eq("id", c.id);
        }
      }

      for (const c of newContestants.filter(c => c.name.trim())) {
        let photoUrl = null;
        if (c.photo) photoUrl = await uploadFile(c.photo, "contestants");
        await supabase.from("contestants").insert({
          event_id: id, name: c.name, bio: c.bio || null,
          category: c.category || null, code: c.code || null, photo_url: photoUrl,
        } as any);
      }

      toast({ title: "Event updated!" });
      navigate("/organizer");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container flex min-h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-bold">Edit Event</h1>
          <p className="mb-8 text-muted-foreground">Update event details and manage contestants</p>
        </motion.div>

        <div className="space-y-8">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
            <h2 className="font-display text-lg font-bold">Event Details</h2>
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} className="mt-1" rows={4} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {["Beauty", "Music", "Sports", "Fashion", "Talent", "Academic", "Corporate", "Entertainment", "Other"].map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Price per Vote *</Label>
                <Input type="number" min="1" value={pricePerVote} onChange={e => setPricePerVote(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Currency *</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Start Date</Label>
                <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Event Banner</Label>
              <div className="mt-1">
                {bannerPreview ? (
                  <div className="relative aspect-[16/7] overflow-hidden rounded-lg border border-border">
                    <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => { setNewBanner(null); setBannerUrl(null); setBannerPreview(""); }}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-10 text-muted-foreground hover:border-accent transition-colors">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Click to upload banner</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Contestants</h2>
              <Button type="button" variant="outline" size="sm" onClick={addNew}>
                <Plus className="h-4 w-4" /> Add New
              </Button>
            </div>

            {existingContestants.map((c, idx) => (
              <div key={c.id} className="relative rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Code:</span>
                    <Input className="w-24 h-7 text-xs" value={c.code || ""} onChange={e => updateExisting(idx, "code", e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{c.vote_count} votes</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove "{c.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>This contestant and their votes will be permanently removed.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeExisting(idx)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full overflow-hidden border border-border bg-muted">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground font-bold text-lg">
                        {c.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Name *" value={c.name} onChange={e => updateExisting(idx, "name", e.target.value)} />
                    <Input placeholder="Category" value={c.category || ""} onChange={e => updateExisting(idx, "category", e.target.value)} />
                    <Input placeholder="Bio" value={c.bio || ""} onChange={e => updateExisting(idx, "bio", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            {newContestants.map((c, idx) => (
              <div key={`new-${idx}`} className="relative rounded-lg border-2 border-dashed border-accent/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">New contestant</span>
                  <button onClick={() => removeNew(idx)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <label className="block h-16 w-16 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-border bg-muted hover:border-accent transition-colors">
                      {c.photoPreview ? (
                        <img src={c.photoPreview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Upload className="h-4 w-4" /></div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleNewPhoto(idx, e)} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Name *" value={c.name} onChange={e => updateNew(idx, "name", e.target.value)} />
                    <Input placeholder="Code (e.g. C01)" value={c.code} onChange={e => updateNew(idx, "code", e.target.value)} />
                    <Input placeholder="Category" value={c.category} onChange={e => updateNew(idx, "category", e.target.value)} />
                    <Input placeholder="Bio" value={c.bio} onChange={e => updateNew(idx, "bio", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            {existingContestants.length === 0 && newContestants.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No contestants. Click "Add New" to add some.</p>
            )}
          </div>

          <Button variant="gold" size="lg" className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default EditEvent;
