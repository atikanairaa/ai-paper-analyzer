<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class JournalSubmittedNotification extends Notification
{
    use Queueable;

    public $paperId;
    public $paperTitle;
    public $researcherName;

    public function __construct($paperId, $paperTitle, $researcherName)
    {
        $this->paperId = $paperId;
        $this->paperTitle = $paperTitle;
        $this->researcherName = $researcherName;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'journal_submitted',
            'paper_id' => $this->paperId,
            'title' => 'Pengajuan Jurnal Baru',
            'message' => 'Peneliti ' . $this->researcherName . ' telah mensubmit paper baru: "' . substr($this->paperTitle, 0, 50) . '..."',
            'url' => '/admin/papers'
        ];
    }
}
