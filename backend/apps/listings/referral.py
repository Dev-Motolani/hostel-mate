from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings


def _percent(value):
    return Decimal(str(value))


def _amount(rent_amount, percent):
    return (Decimal(str(rent_amount)) * percent / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def poster_percent():
    return _percent(settings.POSTER_REFERRAL_PERCENT)


def processor_percent():
    return _percent(settings.PAYMENT_PROCESSOR_PERCENT)


def platform_percent():
    return _percent(settings.HOSTELMATE_FEE_PERCENT)


def total_percent():
    return poster_percent() + processor_percent() + platform_percent()


def poster_amount(rent_amount):
    return _amount(rent_amount, poster_percent())


def processor_amount(rent_amount):
    return _amount(rent_amount, processor_percent())


def platform_amount(rent_amount):
    return _amount(rent_amount, platform_percent())


def total_amount(rent_amount):
    return poster_amount(rent_amount) + processor_amount(rent_amount) + platform_amount(rent_amount)
