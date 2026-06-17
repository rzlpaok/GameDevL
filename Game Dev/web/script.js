window.onload = function () {
  GameController.autoScale();
  window.addEventListener('resize', GameController.autoScale);

  if (window.pywebview) {
    GameController.initApp();
  } else {
    window.addEventListener('pywebviewready', GameController.initApp);
  }
};

const GameController = {
  dataPosts: [],
  dataFakta: [],
  currentIndex: 0,
  score: 0,
  scoreSebelumSif: 0,
  jumlahKalah: 0,
  levelHariIni: 1,
  timeLeft: 125,
  timerInterval: null,

  // Variabel pelacak stat per level
  benarLevelIni: 0,
  salahLevelIni: 0,

  autoScale: function () {
    const container = document.getElementById('game-container');
    if (!container) return;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const scale = Math.min(windowWidth / 384, windowHeight / 216);
    container.style.transform = `scale(${scale})`;
  },

  acakKasus: function (array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  tampilkanAlert: function (judul, pesan) {
    document.getElementById('alert-title').innerText = judul;
    document.getElementById('alert-message').innerText = pesan;
    document.getElementById('modal-alert').style.display = 'flex';
  },

  // --- LOGIKA PERPINDAHAN TAMPILAN ---
  pindahView: function (viewId) {
    // Jika itu adalah pop-up zoom (monitor / buku saku), jangan sembunyikan layar lain
    if (viewId === 'komputer' || viewId === 'bukusaku') {
      document.querySelectorAll('.zoom-overlay').forEach(layar => layar.classList.remove('active'));
      document.getElementById(viewId).classList.add('active');

      if (viewId === 'bukusaku') {
        document.getElementById('buku-saku-list').style.display = 'block';
        document.getElementById('buku-saku-detail').style.display = 'none';
      }
      if (viewId === 'komputer') {
        // Reset panel samping jika buka komputer
        document.getElementById('panel-buku-samping').className = 'panel-samping-sembunyi';
        document.getElementById('btn-toggle-samping').innerText = '▶';
        document.getElementById('buku-saku-list-samping').style.display = 'block';
        document.getElementById('buku-saku-detail-samping').style.display = 'none';
      }
      return;
    }

    if (viewId === 'room') {
      document.querySelectorAll('.zoom-overlay').forEach(layar => layar.classList.remove('active'));
      if (!document.getElementById('room').classList.contains('active')) {
        document.querySelectorAll('.view-screen').forEach(layar => layar.classList.remove('active'));
        document.getElementById('room').classList.add('active');
      }
      return;
    }

    // Tampilan Penuh Biasa
    document.querySelectorAll('.view-screen').forEach(layar => layar.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
  },

  mulaiGameBaru: function () {
    this.levelHariIni = 1;
    this.score = 0;
    this.scoreSebelumSif = 0;
    this.jumlahKalah = 0;
    this.lanjutkanSif();
  },

  lanjutkanSif: function () {
    this.pindahView('loading-screen');
    this.currentIndex = 0;
    this.benarLevelIni = 0; // Reset stat benar/salah tiap awal hari
    this.salahLevelIni = 0;
    this.scoreSebelumSif = this.score;
    clearInterval(this.timerInterval);

    document.getElementById('info-hari').innerText = "HARI KE-" + this.levelHariIni;
    document.getElementById('indikator-hari').innerText = this.levelHariIni;

    // Waktu per kasus diatur di loadPost

    // Mengganti google.script.run dengan pywebview.api
    pywebview.api.getGameData(this.levelHariIni).then((dataDariServer) => {
      if (dataDariServer.posts.length === 0) {
        GameController.tampilkanAlert("Data Kosong", "Data Hari Ke-" + GameController.levelHariIni + " kosong di Database!");
        GameController.pindahView('homescreen');
        return;
      }

      // --- LOGIKA BANK SOAL (ACAK & POTONG) ---
      let semuaPostingan = GameController.acakKasus(dataDariServer.posts);
      let targetKuota = 10;

      GameController.dataPosts = semuaPostingan.slice(0, targetKuota);
      GameController.dataFakta = dataDariServer.fakta;

      GameController.renderBukuSaku();

      let waktuPerKasus = (GameController.levelHariIni >= 4) ? 10 : 15;
      GameController.timeLeft = GameController.dataPosts.length * waktuPerKasus;

      let menit = Math.floor(GameController.timeLeft / 60);
      let detik = GameController.timeLeft % 60;
      document.getElementById('timer-display').innerText = `0${menit}:${detik < 10 ? '0' : ''}${detik}`;

      GameController.loadPost();
      GameController.pindahView('room');
      GameController.startTimer();
    }).catch(err => {
      GameController.tampilkanAlert("Error", "Gagal memuat data dari database lokal.");
      GameController.pindahView('homescreen');
    });
  },

  startTimer: function () {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      let menit = Math.floor(this.timeLeft / 60);
      let detik = this.timeLeft % 60;
      document.getElementById('timer-display').innerText = `0${menit}:${detik < 10 ? '0' : ''}${detik}`;

      if (this.timeLeft <= 0) {
        this.endGame("WAKTU HABIS!");
      }
    }, 1000);
  },

  loadPost: function () {
    if (this.currentIndex >= this.dataPosts.length) {
      this.endGame("KUOTA DOKUMEN TERCAPAI");
      return;
    }

    const post = this.dataPosts[this.currentIndex];

    document.getElementById('room-author').innerText = post.author;
    let textSingkat = post.text;
    if (textSingkat.length > 70) {
      textSingkat = textSingkat.substring(0, 68);
    }
    document.getElementById('room-text').innerText = textSingkat;
    document.getElementById('kuota-display').innerText = (this.currentIndex + 1) + "/" + this.dataPosts.length;

    document.getElementById('komp-author').innerText = post.author;
    document.getElementById('komp-text').innerText = post.text;

    if (this.levelHariIni >= 2) {
      document.getElementById('room-tanggal').innerText = post.tanggal;
      document.getElementById('room-tanggal').style.display = "block";
      document.getElementById('komp-tanggal').innerText = post.tanggal;
      document.getElementById('komp-tanggal').style.display = "block";
    } else {
      document.getElementById('room-tanggal').style.display = "none";
      document.getElementById('komp-tanggal').style.display = "none";
    }

    const roomImgEl = document.getElementById('room-img');
    const kompImgEl = document.getElementById('komp-img');
    const btnScan = document.getElementById('btn-scan-action');

    if (this.levelHariIni >= 3 && post.imgUrl && post.imgUrl !== "") {
      roomImgEl.src = post.imgUrl;
      roomImgEl.style.display = "block";
      kompImgEl.src = post.imgUrl;
      kompImgEl.style.display = "block";
      if (btnScan) btnScan.style.display = "inline-block";
    } else {
      roomImgEl.style.display = "none";
      kompImgEl.style.display = "none";
      if (btnScan) btnScan.style.display = "none";
    }
  },

  renderBukuSaku: function () {
    let html = "";
    let htmlSamping = "";
    this.dataFakta.forEach((fakta, index) => {
      html += `<div style="border-bottom: 1px solid #bdc3c7; padding: 5px 8px; margin-bottom: 4px; font-weight: bold; color: #2980b9;" onclick="GameController.bukaFaktaDetail(${index})">
        ${fakta.judul}
      </div>`;
      htmlSamping += `<div style="border-bottom: 1px solid #bdc3c7; padding: 5px 8px; margin-bottom: 4px; font-weight: bold; color: #2980b9;" onclick="GameController.bukaFaktaDetailSamping(${index})">
        ${fakta.judul}
      </div>`;
    });
    document.getElementById('daftar-fakta-container').innerHTML = html;
    document.getElementById('daftar-fakta-samping-container').innerHTML = htmlSamping;
  },

  bukaFaktaDetail: function (index) {
    const fakta = this.dataFakta[index];
    document.getElementById('buku-saku-detail-judul').innerText = fakta.judul;
    document.getElementById('buku-saku-detail-isi').innerText = fakta.isi;
    document.getElementById('buku-saku-list').style.display = 'none';
    document.getElementById('buku-saku-detail').style.display = 'block';
  },

  bukaFaktaDetailSamping: function (index) {
    const fakta = this.dataFakta[index];
    document.getElementById('buku-saku-detail-judul-samping').innerText = fakta.judul;
    document.getElementById('buku-saku-detail-isi-samping').innerText = fakta.isi;
    document.getElementById('buku-saku-list-samping').style.display = 'none';
    document.getElementById('buku-saku-detail-samping').style.display = 'block';
  },

  toggleBukuSamping: function () {
    const panel = document.getElementById('panel-buku-samping');
    const btn = document.getElementById('btn-toggle-samping');
    if (panel.classList.contains('panel-samping-sembunyi')) {
      panel.classList.remove('panel-samping-sembunyi');
      panel.classList.add('panel-samping-tampil');
      btn.innerText = '◀';
    } else {
      panel.classList.add('panel-samping-sembunyi');
      panel.classList.remove('panel-samping-tampil');
      btn.innerText = '▶';
    }
  },

  // --- LOGIKA EVALUASI BENAR & SALAH ---
  eksekusi: function (keputusan) {
    const post = this.dataPosts[this.currentIndex];
    let salah = false;

    if (keputusan === "LOLOS") {
      if (post.isHoax) {
        this.score -= 10;
        this.salahLevelIni++;
        salah = true;
      } else {
        this.score += 10;
        this.benarLevelIni++;
      }
    } else { // Jika Hapus
      if (post.isHoax) {
        this.score += 10;
        this.benarLevelIni++;
      } else {
        this.score -= 10;
        this.salahLevelIni++;
        salah = true;
      }
    }

    document.getElementById('skor-display').innerText = this.score;

    if (salah) {
      if (this.salahLevelIni === 1) {
        this.tampilkanAlert("SURAT PERINGATAN 1", "Anda mengambil keputusan yang keliru. Hati-hati!");
      } else if (this.salahLevelIni === 2) {
        this.tampilkanAlert("SURAT PERINGATAN 2", "Ini peringatan terakhir! Satu kesalahan lagi Anda akan dipecat!");
      } else if (this.salahLevelIni >= 3) {
        this.endGame("TERLALU BANYAK KESALAHAN");
        return;
      }
    }

    this.currentIndex++;
    this.loadPost();
  },

  // --- LOGIKA TRANSISI LAYAR END LEVEL ---
  endGame: function (alasan) {
    clearInterval(this.timerInterval);

    if (alasan === "WAKTU HABIS!" || alasan === "TERLALU BANYAK KESALAHAN") {
      let pesan = alasan === "WAKTU HABIS!"
        ? "Waktu Habis! Anda gagal menyelesaikan tugas tepat waktu."
        : "Anda telah melakukan 3 kesalahan dan langsung dipecat!";
      document.getElementById('game-over-reason').innerText = pesan;
      this.pindahView('game-over');
      return;
    }

    document.getElementById('end-level-title').innerText = "Evaluasi Sif Hari Ke-" + this.levelHariIni + " (SELESAI)";
    document.getElementById('stat-benar').innerText = this.benarLevelIni;
    document.getElementById('stat-salah').innerText = this.salahLevelIni;
    document.getElementById('stat-skor').innerText = this.score;

    const btnLanjut = document.getElementById('btn-lanjut');

    if (this.levelHariIni >= 4) {
      btnLanjut.innerText = "SELESAIKAN & TAMAT";
      btnLanjut.onclick = () => {
        this.tampilkanAlert("GAME TAMAT", "Selamat! Semua sif berhasil diselesaikan.\nSkor Akhir: " + this.score);
        GameController.pindahView('homescreen');
      };
    } else {
      btnLanjut.innerText = "LANJUT SIF BERIKUTNYA";
      btnLanjut.onclick = () => GameController.lanjutKeLevelBerikutnya();
    }

    this.pindahView('level-end');
  },

  lanjutKeLevelBerikutnya: function () {
    this.levelHariIni++;
    this.lanjutkanSif();
  },

  simpanKeluar: function () {
    document.getElementById('save-lvl-text').innerText = this.levelHariIni;
    document.getElementById('input-nama-save').value = "";
    document.getElementById('modal-save').style.display = 'flex';
  },

  eksekusiSimpan: function () {
    const nama = document.getElementById('input-nama-save').value.trim();
    if (nama === "") {
      this.tampilkanAlert("Gagal", "Nama tidak boleh kosong!");
      return;
    }

    document.getElementById('btn-konfirmasi-save').innerText = "Menyimpan...";

    // Mengganti google.script.run dengan pywebview.api
    pywebview.api.simpanProgres(nama, this.score, this.levelHariIni).then(() => {
      document.getElementById('modal-save').style.display = 'none';
      document.getElementById('btn-konfirmasi-save').innerText = "SIMPAN DATA";

      this.tampilkanAlert("Berhasil", "Data agen " + nama + " berhasil diamankan! Sampai jumpa.");
      this.pindahView('homescreen');
    });
  },

  bukaLeaderboard: function () {
    document.getElementById('modal-leaderboard').style.display = 'flex';
    const container = document.getElementById('daftar-leaderboard-container');
    container.innerHTML = "<p style='color: #f1c40f; text-align: center;'>Menghubungi server...</p>";

    pywebview.api.ambilLeaderboard().then((daftar) => {
      container.innerHTML = "";

      if (daftar.length === 0) {
        container.innerHTML = "<p style='color: #e74c3c; text-align: center;'>Belum ada agen yang mencatatkan skor.</p>";
        return;
      }

      let tableHtml = `<table style="width:100%; text-align:left; color:#ecf0f1; border-collapse: collapse; font-size: 8px;">
        <tr style="border-bottom: 1px solid #34495e; color: #bdc3c7;">
          <th style="padding:2px;">#</th>
          <th style="padding:2px;">NAMA AGEN</th>
          <th style="padding:2px; text-align: right;">SKOR</th>
        </tr>`;

      daftar.forEach((p, index) => {
        let rankColor = "#ecf0f1";
        if (index === 0) rankColor = "#f1c40f";
        else if (index === 1) rankColor = "#bdc3c7";
        else if (index === 2) rankColor = "#cd7f32";

        let fw = index < 3 ? 'bold' : 'normal';

        tableHtml += `<tr style="border-bottom: 1px solid #34495e; color:${rankColor}; font-weight: ${fw};">
          <td style="padding:2px;">${index + 1}</td>
          <td style="padding:2px;">${p.nama}</td>
          <td style="padding:2px; text-align: right;">${p.skor}</td>
        </tr>`;
      });
      tableHtml += `</table>`;

      container.innerHTML = tableHtml;
    });
  },

  // --- LOGIKA LOAD GAME ---
  bukaModalLoad: function () {
    document.getElementById('modal-load').style.display = 'flex';
    const container = document.getElementById('daftar-simpanan-container');
    container.innerHTML = "<p style='color: #f1c40f;'>Mencari agen aktif...</p>";

    // Mengganti google.script.run dengan pywebview.api
    pywebview.api.ambilDaftarSimpanan().then((daftarSaves) => {
      container.innerHTML = "";

      if (daftarSaves.length === 0) {
        container.innerHTML = "<p style='color: #e74c3c;'>Tidak ada data progres aktif.<br>(Atau semua agen sudah tamat).</p>";
        return;
      }

      daftarSaves.forEach(save => {
        let btn = document.createElement('button');
        btn.className = "btn btn-biru";
        btn.style.width = "100%";
        btn.style.margin = "0";
        btn.style.display = "flex";
        btn.style.justifyContent = "space-between";
        btn.style.alignItems = "center";

        btn.innerHTML = `<span>👤 <strong>${save.nama}</strong></span> <span style="font-size: 6px; color:#f1c40f;">Lanjut Hari Ke-${save.level + 1}</span>`;

        btn.onclick = () => GameController.eksekusiLoad(save.nama);
        container.appendChild(btn);
      });
    });
  },

  eksekusiLoad: function (namaPemain) {
    document.getElementById('daftar-simpanan-container').innerHTML = `<p style="color: #2ecc71; font-weight: bold;">Menyinkronkan data ${namaPemain}...</p>`;

    // Mengganti google.script.run dengan pywebview.api
    pywebview.api.muatProgres(namaPemain).then((hasil) => {
      if (hasil.ditemukan) {
        document.getElementById('modal-load').style.display = 'none';

        GameController.score = hasil.skor;
        GameController.scoreSebelumSif = hasil.skor;
        GameController.jumlahKalah = 0;
        GameController.levelHariIni = hasil.level + 1;

        GameController.tampilkanAlert("Berhasil", "Selamat datang kembali, " + namaPemain + "!\nTarget hari ini: Menyelesaikan Sif Hari Ke-" + GameController.levelHariIni);
        GameController.lanjutkanSif();
      } else {
        GameController.tampilkanAlert("Error", "Data atas nama '" + namaPemain + "' bermasalah.");
      }
    });
  },

  keluar: function () {
    // pywebview.api.closeWindow() could be implemented, but simple HTML change works.
    document.body.innerHTML = "<h1 style='text-align:center; color:#e74c3c; margin-top:20vh;'>Sampai Jumpa! Anda bisa menutup jendela ini.</h1>";
  }
};
