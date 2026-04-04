import pytest
from django.urls import reverse
from adventure.models import Activity, Level, Role, Theme, Type

@pytest.mark.django_db
def test_dashboard_view(client):
    url = reverse('adventure:dashboard')
    response = client.get(url)
    assert response.status_code == 200
    assert "Ton Tableau de Bord" in response.content.decode('utf-8')

@pytest.mark.django_db
def test_activity_list_view(client):
    lvl = Level.objects.create(label="6ème")
    Activity.objects.create(title="Ma Quête", level=lvl)
    
    url = reverse('adventure:activity_list')
    response = client.get(url)
    assert response.status_code == 200
    assert "Ma Quête" in response.content.decode('utf-8')

@pytest.mark.django_db
def test_activity_detail_view(client):
    activity = Activity.objects.create(title="Ma Quête Détail")
    url = reverse('adventure:activity_detail', args=[activity.id])
    response = client.get(url)
    assert response.status_code == 200
    assert "Ma Quête Détail" in response.content.decode('utf-8')

@pytest.mark.django_db
def test_login_view(client):
    url = reverse('login')
    response = client.get(url)
    assert response.status_code == 200
    assert "Se connecter" in response.content.decode('utf-8')