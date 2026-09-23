<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Tests\TestCase;

class ModelStructureTest extends TestCase
{
    public function test_user_model_has_required_fillable_attributes(): void
    {
        $user = new User;
        $fillable = $user->getFillable();

        $this->assertContains('name', $fillable);
        $this->assertContains('email', $fillable);
        $this->assertContains('role', $fillable);
        $this->assertContains('owner_id', $fillable);
        $this->assertContains('google_id', $fillable);
    }

    public function test_user_model_relationships(): void
    {
        $user = new User;

        $this->assertInstanceOf(HasMany::class, $user->properties());
        $this->assertInstanceOf(HasMany::class, $user->bookings());
        $this->assertInstanceOf(HasMany::class, $user->ownerBookings());
        $this->assertInstanceOf(HasMany::class, $user->expenses());
        $this->assertInstanceOf(HasMany::class, $user->staff());
        $this->assertInstanceOf(BelongsTo::class, $user->owner());
        $this->assertInstanceOf(HasOne::class, $user->tenantProfile());
        $this->assertInstanceOf(HasManyThrough::class, $user->tenantInvoices());
        $this->assertInstanceOf(HasManyThrough::class, $user->ownerInvoices());
        $this->assertInstanceOf(HasMany::class, $user->ownerPayments());
    }

    public function test_invoice_model_relationships(): void
    {
        $invoice = new Invoice;

        $this->assertInstanceOf(BelongsTo::class, $invoice->booking());
        $this->assertInstanceOf(HasOneThrough::class, $invoice->tenant());
        $this->assertInstanceOf(HasOneThrough::class, $invoice->room());
        $this->assertInstanceOf(HasOneThrough::class, $invoice->owner());
    }

    public function test_room_and_property_relationships(): void
    {
        $property = new Property;
        $this->assertInstanceOf(BelongsTo::class, $property->owner());
        $this->assertInstanceOf(HasMany::class, $property->rooms());
        $this->assertInstanceOf(HasMany::class, $property->images());
        $this->assertInstanceOf(HasManyThrough::class, $property->bookings());

        $room = new Room;
        $this->assertInstanceOf(BelongsTo::class, $room->property());
        $this->assertInstanceOf(HasMany::class, $room->images());
        $this->assertInstanceOf(HasMany::class, $room->bookings());
        $this->assertInstanceOf(HasManyThrough::class, $room->invoices());
        $this->assertInstanceOf(HasOne::class, $room->activeBooking());
    }

    public function test_booking_and_expense_and_tenant_relationships(): void
    {
        $booking = new Booking;
        $this->assertInstanceOf(BelongsTo::class, $booking->room());
        $this->assertInstanceOf(BelongsTo::class, $booking->tenant());
        $this->assertInstanceOf(BelongsTo::class, $booking->owner());
        $this->assertInstanceOf(HasMany::class, $booking->invoices());

        $expense = new Expense;
        $this->assertInstanceOf(BelongsTo::class, $expense->owner());
        $this->assertInstanceOf(BelongsTo::class, $expense->property());

        $tenant = new Tenant;
        $this->assertInstanceOf(BelongsTo::class, $tenant->user());
        $this->assertInstanceOf(HasMany::class, $tenant->bookings());
    }

    public function test_owner_payment_relationships(): void
    {
        $payment = new \App\Models\OwnerPayment;
        $this->assertInstanceOf(BelongsTo::class, $payment->owner());
        $this->assertInstanceOf(BelongsTo::class, $payment->property());
    }
}
