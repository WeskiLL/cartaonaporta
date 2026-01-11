import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Lock, Mail, AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [blockedMinutes, setBlockedMinutes] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading, checkLoginBlocked } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/deep/gestao");
    }
  }, [isAuthenticated, navigate]);

  // Check block status when email changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (email && email.includes('@')) {
        const status = await checkLoginBlocked(email);
        if (status.blocked) {
          setBlockedMinutes(status.blockedMinutes);
          setRemainingAttempts(0);
        } else {
          setBlockedMinutes(null);
          setRemainingAttempts(status.remainingAttempts);
        }
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [email, checkLoginBlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate input
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate("/deep/gestao");
    } else {
      setError(result.error || "Credenciais inválidas");
      
      if (result.blockedMinutes) {
        setBlockedMinutes(result.blockedMinutes);
        setRemainingAttempts(0);
      } else if (result.remainingAttempts !== undefined) {
        setRemainingAttempts(result.remainingAttempts);
      }
    }
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isBlocked = blockedMinutes !== null && blockedMinutes > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-brand-lg border border-border p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Área Administrativa
            </h1>
            <p className="text-muted-foreground mt-2">
              Acesso restrito ao administrador
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isBlocked && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Acesso temporariamente bloqueado</p>
                  <p className="text-xs text-destructive/80 mt-1">
                    Muitas tentativas de login. Tente novamente em {blockedMinutes} minutos.
                  </p>
                </div>
              </div>
            )}

            {error && !isBlocked && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  className="pl-10"
                  required
                  autoComplete="email"
                  disabled={isBlocked}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-10"
                  required
                  autoComplete="current-password"
                  disabled={isBlocked}
                />
              </div>
            </div>

            {remainingAttempts !== null && remainingAttempts < 5 && !isBlocked && (
              <p className="text-xs text-amber-600 text-center">
                ⚠️ {remainingAttempts} tentativas restantes
              </p>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isSubmitting || isBlocked}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : isBlocked ? (
                "Bloqueado"
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Esta área é restrita apenas para administradores.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
