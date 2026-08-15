<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    public function index()
    {
        return Course::with('category')->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $this->validateCourse($request);
        $validated = $this->prepareCourseData($validated);

        return response()->json(Course::create($validated)->load('category'), 201);
    }

    public function show(Course $course)
    {
        return $course->load('category');
    }

    public function update(Request $request, Course $course)
    {
        $validated = $this->validateCourse($request, $course);
        $validated = $this->prepareCourseData($validated, $course);

        $course->update($validated);

        return $course->fresh('category');
    }

    public function destroy(Course $course)
    {
        $course->delete();

        return response()->json(['message' => 'Course deleted.']);
    }

    private function validateCourse(Request $request, ?Course $course = null)
    {
        $courseId = $course?->id;

        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:courses,slug,' . $courseId],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'thumbnail' => ['nullable', 'string'],
            'image' => ['nullable', 'string'],
            'cover_image' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string'],
            'video' => ['nullable', 'string'],
            'preview_video' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'is_free' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'max:50'],
            'difficulty' => ['nullable', 'string', 'max:50'],
            'level' => ['nullable', 'string', 'max:50'],
            'duration' => ['nullable', 'string', 'max:100'],
        ]);
    }

    private function prepareCourseData(array $data, ?Course $course = null)
    {
        $data['slug'] = $data['slug'] ?? Str::slug($data['title']);

        if (array_key_exists('price', $data)) {
            $data['is_free'] = (float) $data['price'] <= 0;
        }

        if (!array_key_exists('status', $data) && array_key_exists('is_published', $data)) {
            $data['status'] = $data['is_published'] ? 'Published' : 'Draft';
        }

        if (!array_key_exists('is_published', $data) && array_key_exists('status', $data)) {
            $data['is_published'] = strtolower($data['status']) === 'published';
        }

        if (!isset($data['thumbnail']) && isset($data['image'])) {
            $data['thumbnail'] = $data['image'];
        }

        if (!isset($data['video_url'])) {
            $data['video_url'] = $data['video'] ?? $data['preview_video'] ?? $course?->video_url;
        }

        return $data;
    }
}
