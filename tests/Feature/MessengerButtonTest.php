<?php

use App\Models\SiteSetting;
use App\Models\User;
use App\Support\FacebookMessenger;
use Inertia\Testing\AssertableInertia as Assert;

test('Facebook Page links become safe direct Messenger destinations', function (string $page, string $identifier) {
    expect(FacebookMessenger::url($page))->toBe('https://m.me/'.$identifier);
})->with([
    'page ID' => ['https://www.facebook.com/profile.php?id=100083094471286', '100083094471286'],
    'page ID with tracking' => ['https://www.facebook.com/profile.php?id=123456&ref=bookmarks', '123456'],
    'username' => ['https://www.facebook.com/Q8.PrivateResort/', 'Q8.PrivateResort'],
    'without scheme' => ['www.facebook.com/Q8.PrivateResort', 'Q8.PrivateResort'],
    'mobile page' => ['https://m.facebook.com/Q8Resort', 'Q8Resort'],
    'legacy page' => ['https://www.facebook.com/pages/Q8-Resort/123456', '123456'],
    'new page slug' => ['https://www.facebook.com/p/Q8-Resort-123456/', '123456'],
    'direct Messenger' => ['https://m.me/Q8Resort?ref=website', 'Q8Resort'],
    'Messenger conversation' => ['https://www.messenger.com/t/123456', '123456'],
]);

test('invalid and shared links cannot become arbitrary message destinations', function (string $page) {
    expect(FacebookMessenger::pageIdentifier($page))->toBeNull();
    expect(FacebookMessenger::url($page))->toBe(FacebookMessenger::DEFAULT_MESSENGER_URL);
})->with([
    'javascript:alert(1)',
    'https://facebook.com.evil.test/Resort',
    'https://facebook.com@evil.test/Resort',
    'https://evil.test/Resort',
    'https://www.facebook.com/share/abc123/',
    'https://www.facebook.com/watch/',
    'https://www.facebook.com/groups/123456',
    'https://www.facebook.com/profile.php?id[]=123456',
    'https://www.facebook.com/profile.php',
    'https://m.me/Resort/unexpected',
    'https://www.facebook.com/messages/t/',
    'https://www.facebook.com/messages/t/101750125870613/unexpected',
    'https://www.facebook.com.evil.test/messages/t/101750125870613',
    'https://www.facebook.com/messages/t/invalid%2Fid',
]);

test('explicit Facebook chat links retain their direct destination', function (string $link) {
    expect(FacebookMessenger::pageIdentifier($link))->toBe('101750125870613');
    expect(FacebookMessenger::url($link))->toBe('https://www.facebook.com/messages/t/101750125870613');
})->with([
    'https://www.facebook.com/messages/t/101750125870613',
    'https://www.facebook.com/messages/t/101750125870613/',
    'https://www.facebook.com/messages/t/101750125870613?ref=website',
    'facebook.com/messages/t/101750125870613',
]);

test('admin can save the supplied chat link and all public Messenger buttons use it directly', function () {
    $url = 'https://www.facebook.com/messages/t/101750125870613';
    $facebook = 'https://www.facebook.com/profile.php?id=100083094471286';
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->post(route('admin.landing-page.update', 'contact'), ['facebook_link' => $facebook, 'messenger_link' => $url])
        ->assertRedirect()->assertSessionHasNoErrors();

    $contact = SiteSetting::where('section', 'contact')->sole();
    expect($contact->facebook_link)->toBe($facebook);
    expect($contact->messenger_link)->toBe($url);
    $this->get(route('admin.landing-page.index'))->assertInertia(fn (Assert $page) => $page
        ->where('contact.facebook_link', $facebook)
        ->where('contact.messenger_link', $url));
    auth()->logout();

    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('contact.facebook_link', $facebook));
    foreach (['/', '/book-now', '/gallery'] as $path) {
        $this->get($path)->assertOk()->assertInertia(fn (Assert $page) => $page->where('messengerUrl', $url));
    }
});

test('landing booking and gallery pages expose the same configured Messenger destination', function (string $path, string $component) {
    SiteSetting::create([
        'section' => 'contact',
        'facebook_link' => FacebookMessenger::DEFAULT_PAGE_URL,
        'messenger_link' => 'https://m.me/Q8Owner',
    ]);

    $this->get($path)->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component($component)
        ->where('messengerUrl', 'https://m.me/Q8Owner'));
})->with([['/', 'landing-page'], ['/book-now', 'customer/book'], ['/gallery', 'resort-gallery']]);

test('the Message button uses the supplied resort chat when Messenger is not configured', function (string $path) {
    $this->get($path)->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('messengerUrl', FacebookMessenger::DEFAULT_MESSENGER_URL));
})->with(['/', '/book-now', '/gallery']);

test('admin can change the Message destination through Contact without accepting share links', function () {
    SiteSetting::create(['section' => 'contact', 'facebook_link' => FacebookMessenger::DEFAULT_PAGE_URL]);
    $this->actingAs(User::factory()->create(['role' => 'admin']));
    $this->post(route('admin.landing-page.update', 'contact'), [
        'messenger_link' => 'https://m.me/UpdatedResort',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->get('/book-now')->assertInertia(fn (Assert $page) => $page->where('messengerUrl', 'https://m.me/UpdatedResort'));

    $this->post(route('admin.landing-page.update', 'contact'), [
        'messenger_link' => 'https://www.facebook.com/share/unknown/',
    ])->assertSessionHasErrors('messenger_link');

    expect(SiteSetting::where('section', 'contact')->sole()->messenger_link)->toBe('https://m.me/UpdatedResort');
    expect(SiteSetting::where('section', 'contact')->sole()->facebook_link)->toBe(FacebookMessenger::DEFAULT_PAGE_URL);

    $this->post(route('admin.landing-page.update', 'contact'), [
        'messenger_link' => ['invalid' => 'value'],
    ])->assertSessionHasErrors('messenger_link');

    $this->post(route('admin.landing-page.update', 'contact'), ['messenger_link' => null])->assertSessionHasNoErrors();
    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('messengerUrl', FacebookMessenger::DEFAULT_MESSENGER_URL)
        ->where('contact.facebook_link', FacebookMessenger::DEFAULT_PAGE_URL));
});

test('changing the public Facebook Page never changes the Messenger destination', function () {
    $contact = SiteSetting::create([
        'section' => 'contact',
        'facebook_link' => FacebookMessenger::DEFAULT_PAGE_URL,
        'messenger_link' => FacebookMessenger::DEFAULT_MESSENGER_URL,
    ]);

    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->post(route('admin.landing-page.update', 'contact'), ['facebook_link' => 'https://www.facebook.com/UpdatedResort'])
        ->assertRedirect()->assertSessionHasNoErrors();

    expect($contact->refresh()->messenger_link)->toBe(FacebookMessenger::DEFAULT_MESSENGER_URL);
    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('contact.facebook_link', 'https://www.facebook.com/UpdatedResort')
        ->where('messengerUrl', FacebookMessenger::DEFAULT_MESSENGER_URL));
});

test('Facebook Page settings reject chat and unsafe links', function (mixed $link) {
    $contact = SiteSetting::create(['section' => 'contact', 'facebook_link' => FacebookMessenger::DEFAULT_PAGE_URL]);

    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->post(route('admin.landing-page.update', 'contact'), ['facebook_link' => $link])
        ->assertSessionHasErrors('facebook_link');

    expect($contact->refresh()->facebook_link)->toBe(FacebookMessenger::DEFAULT_PAGE_URL);
})->with([
    'Facebook chat' => [FacebookMessenger::DEFAULT_MESSENGER_URL],
    'm.me chat' => ['https://m.me/Resort'],
    'Messenger chat' => ['https://www.messenger.com/t/101750125870613'],
    'share link' => ['https://www.facebook.com/share/unknown/'],
    'unsafe URL' => ['javascript:alert(1)'],
    'wrong host' => ['https://www.facebook.com.evil.test/Resort'],
    'invalid type' => [['invalid' => 'value']],
]);

test('a legacy chat link in the Facebook field is not displayed as the public Page destination', function () {
    SiteSetting::create(['section' => 'contact', 'facebook_link' => FacebookMessenger::DEFAULT_MESSENGER_URL]);

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('contact.facebook_link', FacebookMessenger::DEFAULT_PAGE_URL)
        ->where('messengerUrl', FacebookMessenger::DEFAULT_MESSENGER_URL));
});
