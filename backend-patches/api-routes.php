use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CourseController;

/*
|--------------------------------------------------------------------------
| Public / guest routes
|--------------------------------------------------------------------------
*/

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{course}', [CourseController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Authenticated routes (auth:sanctum)
|--------------------------------------------------------------------------
| These must be wrapped in auth:sanctum middleware in the real backend.
| The controllers below come from this package's backend-patches folder;
| the remaining endpoints are served by the existing Laravel backend.
*/

// Courses
Route::post('/courses', [CourseController::class, 'store']);
Route::put('/courses/{course}', [CourseController::class, 'update']);
Route::delete('/courses/{course}', [CourseController::class, 'destroy']);

// Categories (admin)
Route::post('/categories', [CategoryController::class, 'store']);
Route::put('/categories/{category}', [CategoryController::class, 'update']);
Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

// Payments
Route::get('/payments', [PaymentController::class, 'index']);
Route::get('/payments/{payment}', [PaymentController::class, 'show']);
Route::post('/payments', [PaymentController::class, 'store']);
Route::post('/payments/{payment}/check', [PaymentController::class, 'check']);

// Provided by the existing Laravel backend:
//   GET  /my/courses                    -> user's enrolled courses
//   GET  /users                         -> list users (admin)
//   GET  /users/{user}                  -> single user
//   GET  /enrollments                   -> list enrollments (admin)
//   GET  /enrollments/{enrollment}      -> single enrollment
//   GET  /lesson-progress               -> list user's lesson progress
//   GET  /lesson-progress/{progress}    -> single progress record
//   GET  /lessons                       -> list lessons
//   GET  /lessons/{lesson}              -> single lesson
//   GET  /quizzes                       -> list quizzes
//   GET  /quizzes/{quiz}                -> single quiz
//   GET  /questions                     -> list questions
//   GET  /questions/{question}          -> single question