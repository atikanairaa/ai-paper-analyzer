<?php

namespace App\Mail;

use App\Models\Paper;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class ReviewerInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $paper;
    public $reviewerName;
    public $reviewerEmail;
    public $magicLink;

    /**
     * Create a new message instance.
     */
    public function __construct(Paper $paper, $reviewerName, $reviewerEmail)
    {
        $this->paper = $paper;
        $this->reviewerName = $reviewerName;
        $this->reviewerEmail = $reviewerEmail;

        // Create Magic Link (valid for 7 days)
        $this->magicLink = URL::temporarySignedRoute(
            'reviewer.direct-access',
            now()->addDays(7),
            ['paper_id' => $paper->id, 'reviewer_email' => $reviewerEmail]
        );
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Undangan Reviewer: ' . $this->paper->title,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.reviewer_invitation',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
