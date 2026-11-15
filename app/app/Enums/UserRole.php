<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Receptionist = 'receptionist';
    case Customer = 'customer';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrador',
            self::Receptionist => 'Recepcionista',
            self::Customer => 'Cliente',
        };
    }

    public function isStaff(): bool
    {
        return $this !== self::Customer;
    }
}
