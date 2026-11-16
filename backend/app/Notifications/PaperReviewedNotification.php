<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaperReviewedNotification extends Notification
{
    use Queueable;

    public $paperId;
    public $paperTitle;

    public function __construct($paperId, $paperTitle)
    {
        $this->paperId = $paperId;
        $this->paperTitle = $paperTitle;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'paper_reviewed',
            'paper_id' => $this->paperId,
            'title' => 'Review Selesai',
            'message' => 'Paper Anda "' . substr($this->paperTitle, 0, 50) . '..." telah selesai direview.',
            'url' => '/detail/' . $this->paperId
        ];
    }
}
