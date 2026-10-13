<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaperPublishedNotification extends Notification
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
            'type'     => 'paper_published',
            'paper_id' => $this->paperId,
            'title'    => 'Paper Anda Telah Resmi Dipublikasikan!',
            'message'  => 'Selamat! Paper Anda "' . substr($this->paperTitle, 0, 50) . '..." telah resmi diterbitkan ke katalog jurnal publik oleh Admin.',
            'url'      => '/detail/' . $this->paperId,
        ];
    }
}
