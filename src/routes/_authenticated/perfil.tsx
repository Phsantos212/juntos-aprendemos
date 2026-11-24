import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2, Trash2, Upload, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentAuth } from "@/lib/auth-context";
import { useProgress } from "@/lib/progress";
import { authError } from "@/lib/student-rules";
import { pageHead } from "@/lib/page-head";
import { StudentStatus } from "@/components/StudentStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => pageHead("Perfil do aluno", "Atualize seu nome, foto de perfil e senha."),
  component: Perfil,
});

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function Perfil() {
  const { user } = useStudentAuth();
  const { profile, refresh } = useProgress();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");

  useEffect(() => {
    if (profile) setName(profile.full_name);
  }, [profile]);

  useEffect(() => {
    let active = true;
    if (!profile?.avatar_path) {
      setAvatarUrl(null);
      return;
    }
    void supabase.storage
      .from("student-avatars")
      .createSignedUrl(profile.avatar_path, 3600)
      .then(({ data }) => {
        if (active) setAvatarUrl(data?.signedUrl ?? null);
      });
    return () => { active = false; };
  }, [profile?.avatar_path]);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", user.id);
    setSavingName(false);
    if (error) {
      toast.error("Não foi possível atualizar seu nome. Verifique a conexão e tente novamente.");
      return;
    }
    await refresh();
    toast.success("Nome atualizado.");
  };

  const uploadPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error("Envie uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("A foto deve ter no máximo 2 MB.");
      return;
    }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/avatar.${ext}`;
    setUploading(true);
    const up = await supabase.storage.from("student-avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (up.error) {
      setUploading(false);
      toast.error("Não foi possível enviar a foto. Tente novamente.");
      return;
    }
    const upd = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
    setUploading(false);
    if (upd.error) {
      toast.error("A foto foi enviada, mas não foi possível salvar no perfil.");
      return;
    }
    await refresh();
    toast.success("Foto de perfil atualizada.");
  };

  const removePhoto = async () => {
    if (!user || !profile?.avatar_path) return;
    setUploading(true);
    await supabase.storage.from("student-avatars").remove([profile.avatar_path]);
    const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.id);
    setUploading(false);
    if (error) {
      toast.error("Não foi possível remover a foto.");
      return;
    }
    await refresh();
    toast.success("Foto removida.");
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdError("");
    if (newPassword.length < 8) {
      setPwdError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("As novas senhas não coincidem.");
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    });
    setSavingPwd(false);
    if (error) {
      setPwdError(authError(error));
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Senha atualizada com sucesso.");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Perfil do aluno</h1>
        <p className="mt-2 text-muted-foreground">{user?.email}</p>
      </div>
      <StudentStatus />

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-semibold">Foto de perfil</h2>
        <div className="flex flex-wrap items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Foto do aluno" className="h-20 w-20 rounded-full border object-cover" />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground">
              <User className="h-8 w-8" aria-hidden />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" disabled={uploading}>
              <label className="cursor-pointer">
                {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                {uploading ? "Enviando…" : "Enviar foto"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={uploadPhoto} disabled={uploading} />
              </label>
            </Button>
            {profile?.avatar_path && (
              <Button variant="ghost" size="sm" onClick={() => void removePhoto()} disabled={uploading}>
                <Trash2 />Remover
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">JPG, PNG ou WebP de até 2 MB. Sua foto é privada.</p>
      </section>

      <form onSubmit={saveName} className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-semibold">Dados pessoais</h2>
        <div className="space-y-2">
          <Label htmlFor="profile-name">Nome do aluno</Label>
          <Input id="profile-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" disabled={savingName}>
          {savingName && <Loader2 className="animate-spin" />}
          {savingName ? "Salvando…" : "Salvar nome"}
        </Button>
      </form>

      <form onSubmit={changePassword} className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-semibold">Trocar senha</h2>
        <div className="space-y-2">
          <Label htmlFor="current-password">Senha atual</Label>
          <Input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
          <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        {pwdError && <p role="alert" className="text-sm text-destructive">{pwdError}</p>}
        <Button type="submit" disabled={savingPwd}>
          {savingPwd && <Loader2 className="animate-spin" />}
          {savingPwd ? "Atualizando…" : "Atualizar senha"}
        </Button>
      </form>
    </div>
  );
}