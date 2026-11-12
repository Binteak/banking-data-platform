from django.core.management.base import BaseCommand

from api import storage


class Command(BaseCommand):
    help = 'Devuelve los datos (data/runtime) al estado inicial de la demo (data/seed).'

    def handle(self, *args, **options):
        storage.reset_to_seed()
        self.stdout.write(self.style.SUCCESS('Demo data reset to the initial seed.'))
