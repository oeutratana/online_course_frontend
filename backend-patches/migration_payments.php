<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('currency', 10)->default('USD');
            $table->string('method', 50)->default('bakong');
            $table->string('status', 50)->default('pending')->index();
            $table->string('description', 500)->nullable();
            $table->string('transaction_id', 255)->nullable()->index();
            $table->string('bakong_md5', 255)->nullable();
            $table->string('bakong_transaction_id', 255)->nullable();
            $table->text('qr_string')->nullable();
            $table->text('qr_url')->nullable();
            $table->json('provider_payload')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('payments');
    }
};