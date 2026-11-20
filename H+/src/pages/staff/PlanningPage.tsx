import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  api,
  type Chambre,
  type IndisponibiliteChambre,
  type Reservation,
  type StatutReservation,
} from "../../api";
import { ErrorMessage } from "../../shared/ui";
import { dateLabel, dayOffset, messageOf } from "../../shared/format";
import { BackOfficeLayout } from "../../layouts/BackOfficeLayout";

interface PlanningData {
  reservations: Reservation[];
  indisponibilites: IndisponibiliteChambre[];
  chambres: Chambre[];
}

const reservationStatusLabels: Record<StatutReservation, string> = {
  EN_ATTENTE: "À confirmer",
  CONFIRMEE: "Confirmée",
  EN_COURS: "En séjour",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

function dateIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function PlanningPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [data, setData] = useState<PlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [chambreId, setChambreId] = useState("");
  const [dateDebut, setDateDebut] = useState(dayOffset(1));
  const [dateFin, setDateFin] = useState(dayOffset(2));
  const [motif, setMotif] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(
      first.getFullYear(),
      first.getMonth(),
      1 - mondayOffset,
    );
    return Array.from(
      { length: 42 },
      (_, index) =>
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + index,
        ),
    );
  }, [month]);
  const periodStart = dateIso(calendarDays[0]!);
  const periodEnd = dateIso(
    new Date(
      calendarDays[41]!.getFullYear(),
      calendarDays[41]!.getMonth(),
      calendarDays[41]!.getDate() + 1,
    ),
  );

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ debut: periodStart, fin: periodEnd });
    api
      .get<PlanningData>(`/personnel/planning?${query}`)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(messageOf(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [periodStart, periodEnd, refresh]);

  async function addUnavailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      await api.post<IndisponibiliteChambre>("/personnel/indisponibilites", {
        chambreId: Number(chambreId),
        dateDebut,
        dateFin,
        motif,
      });
      setMotif("");
      setNotice("La période d’indisponibilité a été enregistrée.");
      setData(null);
      setLoading(true);
      const blockedMonth = new Date(`${dateDebut}T12:00:00`);
      setMonth(new Date(blockedMonth.getFullYear(), blockedMonth.getMonth(), 1));
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setSaving(false);
    }
  }

  async function removeUnavailability(id: number) {
    setError("");
    setNotice("");
    setDeletingId(id);
    try {
      await api.delete(`/personnel/indisponibilites/${id}`);
      setNotice("L’indisponibilité a été supprimée.");
      setData(null);
      setLoading(true);
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setDeletingId(null);
    }
  }

  const reservations = data?.reservations ?? [];
  const indisponibilites = data?.indisponibilites ?? [];
  const chambres = data?.chambres ?? [];
  const navigateMonth = (offset: number) => {
    setLoading(true);
    setError("");
    setData(null);
    setMonth(
      (value) => new Date(value.getFullYear(), value.getMonth() + offset, 1),
    );
  };
  const goToCurrentMonth = () => {
    const now = new Date();
    setLoading(true);
    setError("");
    setData(null);
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <BackOfficeLayout>
      <section className="content-page staff-page planning-page">
        <div className="backoffice-page-heading">
          <div>
            <span className="eyebrow">Organisation des séjours</span>
            <h1>Planning des réservations</h1>
            <p>
              Consultez les séjours et gérez les indisponibilités par chambre.
            </p>
          </div>
        </div>

        <ErrorMessage>{error}</ErrorMessage>
        {notice && (
          <p className="notice notice-success" role="status">
            {notice}
          </p>
        )}

        <section
          className="planning-calendar"
          aria-label="Calendrier mensuel des réservations"
        >
          <div className="planning-toolbar">
            <div>
              <span className="eyebrow">Calendrier</span>
              <h2>{monthLabel(month)}</h2>
            </div>
            <div className="planning-month-controls">
              <button
                type="button"
                aria-label="Mois précédent"
                onClick={() => navigateMonth(-1)}
              >
                ←
              </button>
              <button type="button" onClick={goToCurrentMonth}>
                Aujourd’hui
              </button>
              <button
                type="button"
                aria-label="Mois suivant"
                onClick={() => navigateMonth(1)}
              >
                →
              </button>
            </div>
          </div>
          <div className="planning-calendar-scroll">
            <div className="planning-calendar-grid">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div className="planning-weekday" key={day}>
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => {
                const key = dateIso(day);
                const dayReservations = reservations.filter(
                  (item) =>
                    item.dateArrivee.slice(0, 10) <= key &&
                    item.dateDepart.slice(0, 10) > key,
                );
                const dayBlocks = indisponibilites.filter(
                  (item) =>
                    item.dateDebut.slice(0, 10) <= key &&
                    item.dateFin.slice(0, 10) > key,
                );
                return (
                  <div
                    className={`planning-day ${day.getMonth() !== month.getMonth() ? "is-outside-month" : ""} ${key === dayOffset(0) ? "is-today" : ""}`}
                    key={key}
                  >
                    <time dateTime={key}>{day.getDate()}</time>
                    <div className="planning-day-events">
                      {dayReservations.map((reservation) => (
                        <article
                          className={`planning-event planning-event-booking status-${reservation.statut.toLowerCase()}`}
                          key={`reservation-${reservation.id}`}
                        >
                          <strong>
                            {reservation.client.prenom} {reservation.client.nom}
                          </strong>
                          <span>
                            {reservation.lignes
                              .map((line) => `Ch. ${line.chambre.numero}`)
                              .join(", ")}
                          </span>
                          <span>
                            {reservationStatusLabels[reservation.statut]}
                          </span>
                        </article>
                      ))}
                      {dayBlocks.map((block) => (
                        <article
                          className="planning-event planning-event-block"
                          key={`block-${block.id}`}
                        >
                          <strong>
                            Ch. {block.chambre.numero} · Indisponible
                          </strong>
                          <span>{block.motif}</span>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {loading && (
            <p className="planning-loading" role="status">
              Chargement du planning…
            </p>
          )}
          {!loading &&
            !error &&
            !reservations.length &&
            !indisponibilites.length && (
            <p className="planning-empty">
              Aucun séjour ou blocage sur cette période.
            </p>
          )}
          <div className="planning-legend">
            <span>
              <i className="planning-legend-booking" /> Séjour
            </span>
            <span>
              <i className="planning-legend-block" /> Indisponibilité
            </span>
          </div>
        </section>

        <div className="planning-management">
          <section className="management-panel">
            <span className="eyebrow">Fermeture ponctuelle</span>
            <h2>Bloquer une chambre</h2>
            <p>
              Une chambre bloquée ne sera pas proposée pour les dates
              concernées.
            </p>
            <form className="planning-block-form" onSubmit={addUnavailability}>
              <label>
                Chambre
                <select
                  value={chambreId}
                  onChange={(event) => setChambreId(event.target.value)}
                  required
                  disabled={!chambres.length}
                >
                  <option value="">Choisir une chambre</option>
                  {chambres.map((room) => (
                    <option key={room.id} value={room.id}>
                      Ch. {room.numero} · {room.typeChambre.nom}
                    </option>
                  ))}
                </select>
              </label>
              <div className="planning-date-fields">
                <label>
                  Début
                  <input
                    type="date"
                    min={dayOffset(0)}
                    value={dateDebut}
                    onChange={(event) => setDateDebut(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Fin (non incluse)
                  <input
                    type="date"
                    min={dateDebut || dayOffset(0)}
                    value={dateFin}
                    onChange={(event) => setDateFin(event.target.value)}
                    required
                  />
                </label>
              </div>
              <label>
                Motif
                <input
                  value={motif}
                  onChange={(event) => setMotif(event.target.value)}
                  maxLength={200}
                  placeholder="Ex. travaux, fermeture technique…"
                  required
                />
              </label>
              <button
                className="button button-dark"
                disabled={saving || !chambres.length}
              >
                {saving ? "Enregistrement…" : "Bloquer la période"}
              </button>
              {!chambres.length && !loading && (
                <p className="planning-empty">
                  Aucune chambre disponible pour créer un blocage.
                </p>
              )}
            </form>
          </section>

          <section className="management-panel planning-block-list">
            <span className="eyebrow">Période affichée</span>
            <h2>Indisponibilités</h2>
            {indisponibilites.length === 0 ? (
              <p>Aucun blocage sur cette période.</p>
            ) : (
              indisponibilites.map((block) => (
                <article className="planning-block-row" key={block.id}>
                  <div>
                    <strong>Chambre {block.chambre.numero}</strong>
                    <span>
                      {dateLabel(block.dateDebut)} — {dateLabel(block.dateFin)}{" "}
                      · {block.motif}
                    </span>
                  </div>
                  <button
                    className="text-button danger-button"
                    disabled={deletingId === block.id}
                    onClick={() => void removeUnavailability(block.id)}
                  >
                    {deletingId === block.id ? "Suppression…" : "Supprimer"}
                  </button>
                </article>
              ))
            )}
          </section>
        </div>
      </section>
    </BackOfficeLayout>
  );
}
