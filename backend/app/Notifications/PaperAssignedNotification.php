<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaperAssignedNotification extends Notification
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
            'type' => 'paper_assigned',
            'paper_id' => $this->paperId,
            'title' => 'Paper Baru Ditugaskan',
            'message' => 'Anda telah ditugaskan untuk mereview paper: "' . substr($this->paperTitle, 0, 50) . '..."',
            'url' => '/reviewer'
        ];
    }
}
