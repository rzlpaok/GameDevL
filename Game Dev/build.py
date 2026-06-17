import os
import subprocess
import sys

def build_exe():
    print("Membangun file .exe dengan PyInstaller...")
    
    # Pemisah path di Windows adalah ';', di Linux/Mac adalah ':'
    separator = ";" if os.name == 'nt' else ":"
    
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",         # Jangan minta konfirmasi (overwrite)
        "--onedir",            # Buat folder berisi .exe dan dependensinya (disarankan untuk aplikasi dengan file data)
        "--windowed",          # Sembunyikan terminal console di background
        f"--add-data=web{separator}web",
        f"--add-data=database.json{separator}.",
        "main.py"
    ]
    
    # Pastikan pyinstaller terinstal
    try:
        import PyInstaller
    except ImportError:
        print("PyInstaller belum terinstal. Menginstal sekarang...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller", "pywebview"])
        
    print(f"Menjalankan perintah: {' '.join(cmd)}")
    subprocess.run(cmd)
    
    print("\n=================================")
    print("Build selesai! Silakan cek folder 'dist/main'")
    print("Jalankan 'main.exe' dari dalam folder tersebut.")
    print("=================================")

if __name__ == "__main__":
    build_exe()
