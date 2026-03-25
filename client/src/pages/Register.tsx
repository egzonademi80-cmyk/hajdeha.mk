import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Utensils, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    restaurantName: "",
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.restaurantName.trim()) e.restaurantName = "Required";
    if (!form.username.trim()) e.username = "Required";
    else if (form.username.length < 3) e.username = "At least 3 characters";
    else if (!/^[a-z0-9._-]+$/i.test(form.username)) e.username = "Letters, numbers, dots and dashes only";
    if (!form.password) e.password = "Required";
    else if (form.password.length < 6) e.password = "At least 6 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.message || "Registration failed", variant: "destructive" });
        return;
      }
      navigate("/admin/dashboard");
    } catch {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const field = (
    id: keyof typeof form,
    label: string,
    placeholder: string,
    type = "text"
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={id === "password" ? (showPassword ? "text" : "password") : type}
          value={form[id]}
          onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-stone-900 text-foreground placeholder:text-muted-foreground text-sm outline-none transition-all
            ${errors[id] ? "border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900" : "border-stone-200 dark:border-stone-700 focus:border-primary focus:ring-2 focus:ring-primary/20"}`}
        />
        {id === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {errors[id] && <p className="text-xs text-red-500 mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Nav */}
      <header className="px-4 h-16 flex items-center">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Utensils className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">HAJDE HA</span>
          </div>
        </Link>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Trial badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <CheckCircle className="h-3.5 w-3.5" />
              30-day free trial · All features included
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-xl p-8">
            <h1 className="text-2xl font-black text-foreground mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Your menu will be live in under 5 minutes.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {field("fullName", "Your name", "e.g. Bujar Aliu")}
              {field("restaurantName", "Restaurant name", "e.g. Restorant Tetova")}
              {field("username", "Username", "e.g. bujar.aliu")}
              {field("password", "Password", "At least 6 characters", "password")}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
              >
                {loading ? "Creating your account…" : (
                  <>Create account <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link href="/auth/login">
                <span className="text-primary font-semibold hover:underline cursor-pointer">Log in</span>
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
            By creating an account you agree to our terms of service.<br />
            No credit card required for the trial period.
          </p>
        </div>
      </div>
    </div>
  );
}
