'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '@/lib/services/auth';
import { Trophy } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => authService.login({ username, password }),
    onSuccess: (response) => {
      toast({
        title: 'Başarılı',
        description: 'Giriş başarılı!',
      });
      router.push('/');
      router.refresh();
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'Giriş yapılamadı.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Turnuva Yönetim Sistemi
          </CardTitle>
          <CardDescription className="text-center">
            Hesabınıza giriş yapın
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                placeholder="kullaniciadi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Kayıt ol
              </Link>
            </div>
            <div className="text-sm text-center text-muted-foreground">
              <Link href="/" className="text-primary hover:underline">
                Ziyaretçi olarak devam et
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
