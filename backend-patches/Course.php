<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'category_id',
        'thumbnail',
        'image',
        'cover_image',
        'video_url',
        'video',
        'preview_video',
        'price',
        'is_free',
        'is_published',
        'status',
        'difficulty',
        'level',
        'duration',
    ];

    protected $casts = [
        'category_id' => 'integer',
        'price' => 'decimal:2',
        'is_free' => 'boolean',
        'is_published' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
