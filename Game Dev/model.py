import json
import os
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(__file__), 'database.json')

def load_db():
    if not os.path.exists(DB_FILE):
        return {"leaderboard": [], "posts": [], "fakta": []}
    with open(DB_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

class ModelAPI:
    def getGameData(self, hari):
        """
        Setara dengan getGameData() di GAS.
        Mengambil postingan dan fakta berdasarkan hari.
        """
        db = load_db()
        
        posts = [p for p in db.get("posts", []) if p.get("hari") == hari]
        fakta = [f for f in db.get("fakta", []) if f.get("hari") == hari]
        
        # Format sesuai dengan ekspektasi frontend (sama seperti GAS)
        formatted_posts = []
        for row in posts:
            formatted_posts.append({
                "author": row.get("author", ""),
                "text": row.get("text", ""),
                "imgUrl": row.get("imgUrl", ""),
                "isAiImage": row.get("isAiImage", False),
                "isHoax": row.get("isHoax", False),
                "tanggal": row.get("tanggal", "")
            })
            
        formatted_fakta = []
        for row in fakta:
            formatted_fakta.append({
                "judul": row.get("judul", ""),
                "isi": row.get("isi", "")
            })
            
        return {"posts": formatted_posts, "fakta": formatted_fakta}

    def simpanProgres(self, nama, skor, level):
        """
        Setara dengan simpanProgres() di GAS.
        Menyimpan: Waktu, Nama, Skor, dan Level TERAKHIR.
        """
        db = load_db()
        
        now_str = datetime.now().strftime("%m/%d/%Y %H:%M:%S")
        new_entry = {
            "Waktu": now_str,
            "Nama_Pemain": nama,
            "Skor_Akhir": skor,
            "Level_Hari": level
        }
        
        db.setdefault("leaderboard", []).append(new_entry)
        save_db(db)
        return True

    def muatProgres(self, nama):
        """
        Setara dengan muatProgres() di GAS.
        Mencari data pemain yang paling baru.
        """
        db = load_db()
        leaderboard = db.get("leaderboard", [])
        
        # Cari dari bawah ke atas (paling baru)
        for i in range(len(leaderboard) - 1, -1, -1):
            entry = leaderboard[i]
            if str(entry.get("Nama_Pemain")).lower() == str(nama).lower():
                return {
                    "ditemukan": True,
                    "skor": entry.get("Skor_Akhir"),
                    "level": entry.get("Level_Hari")
                }
        return {"ditemukan": False}

    def ambilDaftarSimpanan(self):
        """
        Setara dengan ambilDaftarSimpanan() di GAS.
        Mengambil agen yang progres selesainya masih di bawah hari ke-4.
        """
        db = load_db()
        leaderboard = db.get("leaderboard", [])
        
        simpanan_terbaru = {}
        
        # Looping dari awal ke akhir, sehingga yang terbaru menimpa yang lama
        for entry in leaderboard:
            nama = str(entry.get("Nama_Pemain"))
            skor = entry.get("Skor_Akhir")
            level = entry.get("Level_Hari")
            
            simpanan_terbaru[nama] = {
                "nama": nama,
                "skor": skor,
                "level": level
            }
            
        daftar_aktif = []
        for nama, data in simpanan_terbaru.items():
            if data["level"] < 4:
                daftar_aktif.append(data)
                
        return daftar_aktif

    def ambilLeaderboard(self):
        """
        Mengambil semua data leaderboard, digrup berdasarkan nama, 
        diurutkan dari skor tertinggi.
        """
        db = load_db()
        leaderboard = db.get("leaderboard", [])
        
        simpanan_terbaru = {}
        for entry in leaderboard:
            nama = str(entry.get("Nama_Pemain"))
            skor = entry.get("Skor_Akhir", 0)
            
            # Ambil skor tertinggi untuk nama yang sama
            if nama not in simpanan_terbaru or skor > simpanan_terbaru[nama]["skor"]:
                simpanan_terbaru[nama] = {
                    "nama": nama,
                    "skor": skor
                }
                
        daftar = list(simpanan_terbaru.values())
        daftar.sort(key=lambda x: x["skor"], reverse=True)
        return daftar
