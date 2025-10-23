"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  Settings,
  User,
  Shield,
  Bell,
  Database,
  Lock,
  Globe,
  Palette,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  Trophy
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/')
    }
  }, [user, isAdmin, router])

  // Settings state
  const [settings, setSettings] = useState({
    // General Settings
    siteName: "Football Tournament Manager",
    siteDescription: "Turnuva Yönetim Sistemi",
    language: "tr",
    timezone: "Europe/Istanbul",
    
    // Tournament Settings
    defaultMatchDuration: 90,
    defaultBreakDuration: 15,
    maxTeamsPerTournament: 32,
    minTeamsPerGroup: 3,
    maxTeamsPerGroup: 6,
    
    // Notification Settings
    emailNotifications: true,
    matchReminders: true,
    scoreUpdateNotifications: true,
    tournamentStartNotifications: true,
    
    // Security Settings
    requireEmailVerification: false,
    allowGuestAccess: true,
    sessionTimeout: 7, // days
    maxLoginAttempts: 5,
    
    // Display Settings
    showPlayerStats: true,
    showTeamLogos: true,
    showLiveScores: true,
    compactMode: false,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Ayarlar Kaydedildi",
        description: "Sistem ayarları başarıyla güncellendi.",
      })
      setHasChanges(false)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (window.confirm("Tüm ayarları varsayılan değerlere döndürmek istediğinize emin misiniz?")) {
      // Reset to default values
      toast({
        title: "Ayarlar Sıfırlandı",
        description: "Tüm ayarlar varsayılan değerlere döndürüldü.",
      })
      setHasChanges(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erişim Reddedildi</AlertTitle>
          <AlertDescription>
            Bu sayfaya erişim için yönetici yetkisine sahip olmalısınız.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            Sistem Ayarları
          </h1>
          <p className="text-muted-foreground mt-2">
            Uygulama ayarlarını yönetin ve özelleştirin
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <Shield className="h-3 w-3" />
          Admin Panel
        </Badge>
      </div>

      {/* Save/Reset Actions */}
      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Kaydedilmemiş Değişiklikler</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Yaptığınız değişiklikleri kaydetmeyi unutmayın.</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sıfırla
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="h-4 w-4" />
            Genel
          </TabsTrigger>
          <TabsTrigger value="tournament" className="gap-2">
            <Trophy className="h-4 w-4" />
            Turnuva
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Güvenlik
          </TabsTrigger>
          <TabsTrigger value="display" className="gap-2">
            <Palette className="h-4 w-4" />
            Görünüm
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>
                Temel sistem ayarlarını yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Adı</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => handleSettingChange("siteName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Açıklaması</Label>
                <Input
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Dil</Label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => handleSettingChange("language", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Saat Dilimi</Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange("timezone", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                    <option value="UTC">UTC (GMT+0)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tournament Settings */}
        <TabsContent value="tournament" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Turnuva Ayarları</CardTitle>
              <CardDescription>
                Turnuva ve maç ayarlarını yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultMatchDuration">Varsayılan Maç Süresi (dk)</Label>
                  <Input
                    id="defaultMatchDuration"
                    type="number"
                    value={settings.defaultMatchDuration}
                    onChange={(e) => handleSettingChange("defaultMatchDuration", parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultBreakDuration">Devre Arası Süresi (dk)</Label>
                  <Input
                    id="defaultBreakDuration"
                    type="number"
                    value={settings.defaultBreakDuration}
                    onChange={(e) => handleSettingChange("defaultBreakDuration", parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxTeamsPerTournament">Maksimum Takım Sayısı (Turnuva Başına)</Label>
                <Input
                  id="maxTeamsPerTournament"
                  type="number"
                  value={settings.maxTeamsPerTournament}
                  onChange={(e) => handleSettingChange("maxTeamsPerTournament", parseInt(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minTeamsPerGroup">Min. Takım (Grup)</Label>
                  <Input
                    id="minTeamsPerGroup"
                    type="number"
                    value={settings.minTeamsPerGroup}
                    onChange={(e) => handleSettingChange("minTeamsPerGroup", parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTeamsPerGroup">Maks. Takım (Grup)</Label>
                  <Input
                    id="maxTeamsPerGroup"
                    type="number"
                    value={settings.maxTeamsPerGroup}
                    onChange={(e) => handleSettingChange("maxTeamsPerGroup", parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>
                Sistem bildirimlerini yönetin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-posta Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Önemli olaylar için e-posta gönder
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maç Hatırlatıcıları</Label>
                  <p className="text-sm text-muted-foreground">
                    Maçlardan önce hatırlatma gönder
                  </p>
                </div>
                <Switch
                  checked={settings.matchReminders}
                  onCheckedChange={(checked) => handleSettingChange("matchReminders", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Skor Güncellemeleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Maç skorları güncellendiğinde bildir
                  </p>
                </div>
                <Switch
                  checked={settings.scoreUpdateNotifications}
                  onCheckedChange={(checked) => handleSettingChange("scoreUpdateNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Turnuva Başlangıcı</Label>
                  <p className="text-sm text-muted-foreground">
                    Turnuva başladığında bildir
                  </p>
                </div>
                <Switch
                  checked={settings.tournamentStartNotifications}
                  onCheckedChange={(checked) => handleSettingChange("tournamentStartNotifications", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Ayarları</CardTitle>
              <CardDescription>
                Güvenlik ve erişim kontrollerini yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-posta Doğrulama Gerektir</Label>
                  <p className="text-sm text-muted-foreground">
                    Kayıt sonrası e-posta doğrulaması zorunlu olsun
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => handleSettingChange("requireEmailVerification", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Misafir Erişimi</Label>
                  <p className="text-sm text-muted-foreground">
                    Giriş yapmadan görüntülemeye izin ver
                  </p>
                </div>
                <Switch
                  checked={settings.allowGuestAccess}
                  onCheckedChange={(checked) => handleSettingChange("allowGuestAccess", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Oturum Süresi (gün)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Kullanıcılar bu süre sonra tekrar giriş yapmalı
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Maksimum Giriş Denemesi</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange("maxLoginAttempts", parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Bu sayıda başarısız denemeden sonra hesap geçici olarak kilitlenir
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Settings */}
        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Görünüm Ayarları</CardTitle>
              <CardDescription>
                Arayüz görünümünü özelleştirin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Oyuncu İstatistikleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Oyuncu istatistiklerini göster
                  </p>
                </div>
                <Switch
                  checked={settings.showPlayerStats}
                  onCheckedChange={(checked) => handleSettingChange("showPlayerStats", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Takım Logoları</Label>
                  <p className="text-sm text-muted-foreground">
                    Takım logolarını göster
                  </p>
                </div>
                <Switch
                  checked={settings.showTeamLogos}
                  onCheckedChange={(checked) => handleSettingChange("showTeamLogos", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Canlı Skorlar</Label>
                  <p className="text-sm text-muted-foreground">
                    Canlı skor güncellemelerini göster
                  </p>
                </div>
                <Switch
                  checked={settings.showLiveScores}
                  onCheckedChange={(checked) => handleSettingChange("showLiveScores", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Kompakt Mod</Label>
                  <p className="text-sm text-muted-foreground">
                    Daha yoğun arayüz düzeni kullan
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => handleSettingChange("compactMode", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Varsayılana Dön
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </div>
  )
}
