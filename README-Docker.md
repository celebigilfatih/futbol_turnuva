# Football Tour - Docker Kurulumu

Bu proje Docker ve Docker Compose kullanılarak containerize edilmiştir.

## Gereksinimler

- Docker Desktop (Windows için)
- Docker Compose

## Kurulum ve Çalıştırma

### 1. Docker Desktop'ı Başlatın
Docker Desktop uygulamasının çalıştığından emin olun.

### 2. Projeyi Klonlayın
```bash
git clone <repository-url>
cd football-tour
```

### 3. Docker Container'ları Oluşturun ve Başlatın
```bash
# Container'ları oluştur ve başlat
docker-compose up --build

# Arka planda çalıştırmak için
docker-compose up --build -d
```

### 4. Uygulamaya Erişim
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## Servisler

### Frontend
- **Port**: 3000
- **Framework**: Next.js 15
- **Build**: Production optimized standalone build

### Backend
- **Port**: 5000
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB connection

### MongoDB
- **Port**: 27017
- **Version**: Latest
- **Data**: Persistent volume (mongodb_data)

## Yararlı Komutlar

```bash
# Container'ları durdur
docker-compose down

# Container'ları durdur ve volume'ları sil
docker-compose down -v

# Logları görüntüle
docker-compose logs

# Belirli bir servisin loglarını görüntüle
docker-compose logs frontend
docker-compose logs backend
docker-compose logs mongodb

# Container'ları yeniden oluştur
docker-compose build --no-cache

# Çalışan container'ları listele
docker-compose ps
```

## Geliştirme

Geliştirme sırasında değişiklikleri test etmek için:

```bash
# Container'ları durdur
docker-compose down

# Yeniden oluştur ve başlat
docker-compose up --build
```

## Sorun Giderme

### Docker Desktop Çalışmıyor
- Docker Desktop uygulamasını başlatın
- Windows'ta WSL2 backend'in etkin olduğundan emin olun

### Port Çakışması
- Eğer portlar kullanılıyorsa, docker-compose.yml dosyasındaki port mapping'lerini değiştirin

### Build Hataları
- Docker cache'i temizleyin: `docker system prune -a`
- Container'ları yeniden oluşturun: `docker-compose build --no-cache`