<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'room_number' => $this->room_number,
            'price' => (float) $this->price,
            'deposit' => (float) ($this->deposit ?? 0),
            'type' => $this->type,
            'status' => $this->status,
            'floor' => $this->floor,
            'amenities' => $this->amenities,
            'description' => $this->description,
            'property' => $this->whenLoaded('property', fn () => [
                'id' => $this->property->id,
                'title' => $this->property->title,
                'address' => $this->property->address,
                'city' => $this->property->city,
            ]),
            'images' => $this->whenLoaded('images', fn () => $this->images->pluck('image_path')),
            'created_at' => optional($this->created_at)->format('Y-m-d H:i:s'),
        ];
    }
}
