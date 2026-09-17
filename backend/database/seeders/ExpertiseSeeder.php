<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExpertiseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $expertises = [
            'Matematika & Statistika',
            'Fisika & Astronomi',
            'Kimia',
            'Biologi & Bioteknologi',
            'Ilmu Komputer & Informatika',
            'Teknik Elektro & Telekomunikasi',
            'Teknik Mesin & Dirgantara',
            'Teknik Sipil & Perencanaan',
            'Teknik Kimia & Material',
            'Pertanian & Agronomi',
            'Kehutanan & Lingkungan',
            'Kelautan & Perikanan',
            'Kedokteran Umum & Spesialis',
            'Kedokteran Gigi',
            'Kedokteran Hewan',
            'Farmasi & Kedokteran',
            'Keperawatan & Kebidanan',
            'Kesehatan Masyarakat',
            'Gizi & Dietetika',
            'Psikiatri',
            'Ekonomi & Makroekonomi',
            'Manajemen & Bisnis',
            'Akuntansi & Audit',
            'Hukum',
            'Sosiologi',
            'Antropologi & Budaya',
            'Ilmu Politik & Pemerintahan',
            'Hubungan Internasional',
            'Ilmu Komunikasi & Media',
            'Psikologi',
            'Sejarah & Arkeologi',
            'Filsafat & Etika',
            'Linguistik & Bahasa',
            'Sastra & Filologi',
            'Seni Rupa & Desain',
            'Seni Pertunjukan & Musik',
            'Manajemen Pendidikan',
            'Kurikulum & Teknologi',
            'Evaluasi Pendidikan',
            'PAUD & Pendidikan Dasar',
            'Pendidikan Bidang Studi',
            'Studi Agama Islam',
            'Studi Agama Kristen/Katolik',
            'Studi Agama Hindu/Buddha/Lainnya',
            'Pengabdian Masyarakat',
            'Studi Gender',
            'Pariwisata & Perhotelan',
            'Ilmu Pertahanan',
        ];

        // Kosongkan tabel terlebih dahulu (opsional, agar tidak duplikat jika dijalankan ulang)
        DB::table('expertises')->truncate();

        $data = [];
        foreach ($expertises as $exp) {
            $data[] = [
                'name' => $exp,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('expertises')->insert($data);
    }
}
