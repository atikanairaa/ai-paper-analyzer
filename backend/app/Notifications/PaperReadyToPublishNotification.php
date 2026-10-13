<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaperReadyToPublishNotification extends Notification
{
    use Queueable;

    public $paperId;
    public $paperTitle;
    public $researcherName;
    public $accessType;

    public function __construct($paperId, $paperTitle, $researcherName, $accessType)
    {
        $this->paperId = $paperId;
        $this->paperTitle = $paperTitle;
        $this->researcherName = $researcherName;
        $this->accessType = $accessType;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $typeLabel = $this->accessType === 'CLOSED_ACCESS' ? 'Closed Access' : 'Open Access (Lunas)';

        return [
            'type'            => 'paper_ready_to_publish',
            'paper_id'        => $this->paperId,
            'title'           => 'Paper Siap Diterbitkan (' . $typeLabel . ')',
            'message'         => 'Peneliti ' . $this->researcherName . ' telah menyelesaikan administrasi (' . $typeLabel . ') untuk paper: "' . substr($this->paperTitle, 0, 50) . '...". Paper siap untuk diterbitkan.',
            'url'             => '/admin/paper-publications?paper_id=' . $this->paperId,
            'access_type'     => $this->accessType,
            'researcher_name' => $this->researcherName,
        ];
    }
}
