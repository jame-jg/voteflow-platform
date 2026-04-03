import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Plus, X, Loader2 } from "lucide-react";
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

interface ContestantInput {
  name: string;
  bio: string;
  category: string;
  photo: File | null;
  photoPreview: string;
}

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      const roles = (data || []).map((r) => r.role);
      if (!roles.includes("organizer") && !roles.includes("admin")) {
        toast({ title: "Access Denied", description: "Only organizers can create events. Please register as an organizer.", variant: "destructive" });
        navigate("/events");
      } else {
        setRoleChecked(true);
      }
    });
  }, [user, authLoading]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pricePerVote, setPricePerVote] = useState("100");
  const [currency, setCurrency] = useState("NGN");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [contestants, setContestants] = useState<ContestantInput[]>([
    { name: "", bio: "", category: "", photo: null, photoPreview: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBanner(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleContestantPhoto = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setContestants((prev) =>
        prev.map((c, i) =>
          i === idx ? { ...c, photo: file, photoPreview: URL.createObjectURL(file) } : c
        )
      );
    }
  };

  const addContestant = () => {
    setContestants((prev) => [...prev, { name: "", bio: "", category: "", photo: null, photoPreview: "" }]);
  };

  const removeContestant = (idx: number) => {
    if (contestants.length <= 1) return;
    setContestants((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateContestant = (idx: number, field: "name" | "bio", value: string) => {
    setContestants((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  const uploadFile = async (file: File, path: string) => {
    const ext = file.name.split(".").pop();
    const fileName = `${path}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("event-assets").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("event-assets").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please log in", description: "You must be logged in to create an event." });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    const validContestants = contestants.filter((c) => c.name.trim());
    if (validContestants.length < 2) {
      toast({ title: "Add at least 2 contestants", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Upload banner
      let bannerUrl = null;
      if (banner) {
        bannerUrl = await uploadFile(banner, "banners");
      }

      // Create event
      const { data: event, error: eventErr } = await supabase
        .from("events")
        .insert({
          title,
          description,
          category: category || null,
          price_per_vote: parseInt(pricePerVote) || 100,
          currency,
          start_date: startDate || null,
          end_date: endDate || null,
          banner_url: bannerUrl,
          organizer_id: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (eventErr) throw eventErr;

      // Upload contestant photos and create contestants
      for (const c of validContestants) {
        let photoUrl = null;
        if (c.photo) {
          photoUrl = await uploadFile(c.photo, "contestants");
        }
        const { error } = await supabase.from("contestants").insert({
          event_id: event.id,
          name: c.name,
          bio: c.bio || null,
          photo_url: photoUrl,
        });
        if (error) throw error;
      }

      toast({ title: "Event created!", description: "Your event is pending approval." });
      navigate("/organizer");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-bold">Create Event</h1>
          <p className="mb-8 text-muted-foreground">Set up your voting event and add contestants</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Details */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
            <h2 className="font-display text-lg font-bold">Event Details</h2>

            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Miss Campus Queen 2026" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your event..." className="mt-1" rows={4} />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {["Beauty", "Music", "Sports", "Fashion", "Talent", "Academic", "Corporate", "Entertainment", "Other"].map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="price">Price per Vote *</Label>
                <Input id="price" type="number" min="1" value={pricePerVote} onChange={(e) => setPricePerVote(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Currency *</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="start">Start Date</Label>
                <Input id="start" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="end">End Date</Label>
                <Input id="end" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Event Banner</Label>
              <div className="mt-1">
                {bannerPreview ? (
                  <div className="relative aspect-[16/7] overflow-hidden rounded-lg border border-border">
                    <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => { setBanner(null); setBannerPreview(""); }}
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

          {/* Contestants */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Contestants</h2>
              <Button type="button" variant="outline" size="sm" onClick={addContestant}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>

            {contestants.map((c, idx) => (
              <div key={idx} className="relative rounded-lg border border-border p-4 space-y-3">
                {contestants.length > 1 && (
                  <button type="button" onClick={() => removeContestant(idx)} className="absolute right-3 top-3 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <label className="block h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-border bg-muted hover:border-accent transition-colors">
                      {c.photoPreview ? (
                        <img src={c.photoPreview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Upload className="h-5 w-5" />
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleContestantPhoto(idx, e)} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Contestant name *" value={c.name} onChange={(e) => updateContestant(idx, "name", e.target.value)} />
                    <Input placeholder="Short bio (optional)" value={c.bio} onChange={(e) => updateContestant(idx, "bio", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Event...</> : "Create Event"}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default CreateEvent;
