<?php

use App\Models\Favorite;
use App\Models\Icd10Cm;
use App\Models\Icd10Pcs;
use App\Models\User;

// ─── Helpers ────────────────────────────────────────────────────────────────

function cmCode(): Icd10Cm
{
    return Icd10Cm::create([
        'code'        => 'T99.9',
        'description' => 'Test CM code',
        'valid'       => true,
    ]);
}

function pcsCode(): Icd10Pcs
{
    return Icd10Pcs::create([
        'code'        => '0ZZ0000',
        'description' => 'Test PCS code',
    ]);
}

// ─── GET /api/v1/favorites ──────────────────────────────────────────────────

test('guests cannot list favorites', function () {
    $this->getJson('/api/v1/favorites')->assertUnauthorized();
});

test('authenticated user gets an empty list when no favorites exist', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/favorites')
        ->assertOk()
        ->assertJson(['data' => []]);
});

test('user sees only their own favorites', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $cm    = cmCode();

    Favorite::create([
        'user_id'        => $owner->id,
        'favorable_id'   => $cm->id,
        'favorable_type' => Icd10Cm::class,
    ]);

    Favorite::create([
        'user_id'        => $other->id,
        'favorable_id'   => $cm->id,
        'favorable_type' => Icd10Cm::class,
    ]);

    $this->actingAs($owner)
        ->getJson('/api/v1/favorites')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('favorites list is ordered newest first', function () {
    $user   = User::factory()->create();
    $first  = Icd10Cm::create(['code' => 'A00.0', 'description' => 'First',  'valid' => true]);
    $second = Icd10Cm::create(['code' => 'A00.1', 'description' => 'Second', 'valid' => true]);

    $fav1 = new Favorite(['user_id' => $user->id, 'favorable_id' => $first->id,  'favorable_type' => Icd10Cm::class]);
    $fav1->created_at = now()->subMinute();
    $fav1->save();

    $fav2 = new Favorite(['user_id' => $user->id, 'favorable_id' => $second->id, 'favorable_type' => Icd10Cm::class]);
    $fav2->created_at = now();
    $fav2->save();

    $response = $this->actingAs($user)
        ->getJson('/api/v1/favorites')
        ->assertOk();

    expect($response->json('data.0.favorable_id'))->toBe($second->id);
});

// ─── POST /api/v1/favorites ─────────────────────────────────────────────────

test('guests cannot store favorites', function () {
    $cm = cmCode();

    $this->postJson('/api/v1/favorites', [
        'favorable_id'   => $cm->id,
        'favorable_type' => 'icd10_cm',
    ])->assertUnauthorized();
});

test('authenticated user can add a CM code as favorite', function () {
    $user = User::factory()->create();
    $cm   = cmCode();

    $this->actingAs($user)
        ->postJson('/api/v1/favorites', [
            'favorable_id'   => $cm->id,
            'favorable_type' => 'icd10_cm',
        ])
        ->assertCreated()
        ->assertJsonPath('data.user_id', $user->id)
        ->assertJsonPath('data.favorable_id', $cm->id)
        ->assertJsonPath('data.favorable_type', Icd10Cm::class);

    $this->assertDatabaseHas('favorites', [
        'user_id'        => $user->id,
        'favorable_id'   => $cm->id,
        'favorable_type' => Icd10Cm::class,
    ]);
});

test('authenticated user can add a PCS code as favorite', function () {
    $user = User::factory()->create();
    $pcs  = pcsCode();

    $this->actingAs($user)
        ->postJson('/api/v1/favorites', [
            'favorable_id'   => $pcs->id,
            'favorable_type' => 'icd10_pcs',
        ])
        ->assertCreated()
        ->assertJsonPath('data.user_id', $user->id)
        ->assertJsonPath('data.favorable_id', $pcs->id)
        ->assertJsonPath('data.favorable_type', Icd10Pcs::class);
});

test('adding an already-favorited code returns 200 instead of 201', function () {
    $user = User::factory()->create();
    $cm   = cmCode();

    $payload = ['favorable_id' => $cm->id, 'favorable_type' => 'icd10_cm'];

    $this->actingAs($user)->postJson('/api/v1/favorites', $payload)->assertCreated();
    $this->actingAs($user)->postJson('/api/v1/favorites', $payload)->assertOk();

    $this->assertDatabaseCount('favorites', 1);
});

test('store validates that favorable_id is required', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/v1/favorites', ['favorable_type' => 'icd10_cm'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['favorable_id']);
});

test('store validates that favorable_type is required', function () {
    $user = User::factory()->create();
    $cm   = cmCode();

    $this->actingAs($user)
        ->postJson('/api/v1/favorites', ['favorable_id' => $cm->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['favorable_type']);
});

test('store rejects an unknown favorable_type', function () {
    $user = User::factory()->create();
    $cm   = cmCode();

    $this->actingAs($user)
        ->postJson('/api/v1/favorites', [
            'favorable_id'   => $cm->id,
            'favorable_type' => 'invalid_type',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['favorable_type']);
});

// ─── DELETE /api/v1/favorites/{favorite} ────────────────────────────────────

test('guests cannot delete favorites', function () {
    $user     = User::factory()->create();
    $cm       = cmCode();
    $favorite = Favorite::create([
        'user_id'        => $user->id,
        'favorable_id'   => $cm->id,
        'favorable_type' => Icd10Cm::class,
    ]);

    $this->deleteJson("/api/v1/favorites/{$favorite->id}")->assertUnauthorized();
});

test('authenticated user can delete their own favorite', function () {
    $user     = User::factory()->create();
    $cm       = cmCode();
    $favorite = Favorite::create([
        'user_id'        => $user->id,
        'favorable_id'   => $cm->id,
        'favorable_type' => Icd10Cm::class,
    ]);

    $this->actingAs($user)
        ->deleteJson("/api/v1/favorites/{$favorite->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('favorites', ['id' => $favorite->id]);
});

test('user cannot delete another user\'s favorite', function () {
    $owner  = User::factory()->create();
    $other  = User::factory()->create();
    $cm     = cmCode();

    $favorite = Favorite::create([
        'user_id'        => $owner->id,
        'favorable_id'   => $cm->id,
        'favorable_type' => Icd10Cm::class,
    ]);

    $this->actingAs($other)
        ->deleteJson("/api/v1/favorites/{$favorite->id}")
        ->assertForbidden();

    $this->assertDatabaseHas('favorites', ['id' => $favorite->id]);
});

test('deleting a non-existent favorite returns 404', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->deleteJson('/api/v1/favorites/99999')
        ->assertNotFound();
});
