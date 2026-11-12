from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsDataAdminForWrites(BasePermission):
    """Lectura para cualquier usuario autenticado; escritura solo DataAdmin.

    Se aplica a las vistas que modifican datos (subida y borrado). El frontend
    oculta los botones a los Analyst, pero la regla real se comprueba aquí.
    """

    message = "Tu rol (Analyst) solo permite consultar datos."

    def has_permission(self, request, view):
        user = request.user
        if not user or not getattr(user, "is_authenticated", False):
            return False
        if request.method in SAFE_METHODS:
            return True
        return getattr(user, "is_data_admin", False)
