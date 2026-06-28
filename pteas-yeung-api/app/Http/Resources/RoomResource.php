<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'room_number' => $this->room_number,
            'price'       => $this->price,
            'status'      => $this->status, // ឧទាហរណ៍: available, occupied
            'property'    => [
                'id'   => $this->property->id,
                'name' => $this->property->name,
            ],
            // បងអាចបន្ថែម Date format ឱ្យស្អាតបាននៅទីនេះ
            'created_at'  => $this->created_at->format('d/m/Y'),
        ];
    }
}
