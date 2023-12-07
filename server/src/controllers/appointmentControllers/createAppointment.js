const {
  Appointment,
  TattooArtist,
  Customer,
  TimeAvailability,
  TimeAvailabilityException,
  PriceRange,
} = require("../../db");

const sizesAndDurations = {
  Pequeño: 1,
  "Pequeño a color": 1,
  Mediano: 2,
  "Mediano a color": 2,
  Grande: 3,
  "Grande a color": 3,
  Pequeño: 1,
  "Pequeño a color": 1,
  Mediano: 2,
  "Mediano a color": 2,
  Grande: 3,
  "Grande a color": 3,
};

const daysOfWeekNames = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const createAppointment = async ({
  tattooArtistId,
  customerId,
  size,
  image,
  bodyPlace,
  description,
  dateAndTime,
}) => {
  //chequea que exista el tatuador
  const tattooArtist = await TattooArtist.findByPk(tattooArtistId);
  if (tattooArtist === null) {
    return { code: 404, error: "Tattoo artist not found" };
  }

  //chequea que exista el cliente
  const customer = await Customer.findByPk(customerId);
  if (customer === null) {
    return { code: 404, error: "Customer not found" };
  }

  //cálculo del día de la semana:
  const date = new Date(dateAndTime);
  const exactDate = date.toISOString();

  const dayOfWeek = date.getDay();
  const dayName = daysOfWeekNames[dayOfWeek];

  //busca dentro de timeAvailability si ese día de la semana ese tatuador trabaja
  const possibleAvialability = await TimeAvailability.findOne({
    where: { TattooArtistId: tattooArtistId, day: dayName },
  });
  //si no tiene disponibilidad horaria cargada ese día dice que ese día no está disponible
  if (possibleAvialability === null) {
    return { code: 404, error: "Day not available" };
  }
  // si existe disponibilidad horaria, se queda con los horarios cargados para ese día
  let initialHour = possibleAvialability.initialHour;
  let finalHour = possibleAvialability.finalHour;
  let secondInitialHour = possibleAvialability.secondInitialHour;
  let secondFinalHour = possibleAvialability.secondFinalHour;

  //cálculo fecha
  const dateOrTime = exactDate.split("T");

  //busca dentro de timeAvailabilityException si esa fecha ese tatuador tiene una excepcion cargada
  const possibleException = await TimeAvailabilityException.findOne({
    where: { TattooArtistId: tattooArtistId, date: dateOrTime[0] },
  });
  //si hay una excepcion y el horario es nulo significa que esa fecha no trabaja
  if (possibleException && possibleException.initialHour === null) {
    return { code: 400, error: "The tattoo artist doesn't work that day" };
  }
  //si esa fecha sí trabaja, se queda con los horarios cargados para ese día
  if (possibleException && possibleException.initialHour !== null) {
    initialHour = possibleException.initialHour;
    finalHour = possibleException.finalHour;
    secondInitialHour = possibleException.secondInitialHour;
    secondFinalHour = possibleException.secondFinalHour;
  }

  //comparar las horas


  //caso la hora laboral inicial sea mayor a la hora elegida para el turno, error
if (secondInitialHour) {
  if (secondInitialHour > dateOrTime[1]) {
    if (finalHour < dateOrTime[1]) {
    return { code: 400, error: "The tattoo artist starts working later" };
  }}
} else {
  if (initialHour > dateOrTime[1]) {
    return { code: 400, error: "The tattoo artist starts working later" };
  }
}
  //caso la hora laboral final sea menor a la hora elegida para el turno, error
  if (secondFinalHour) {
    if (secondFinalHour < dateOrTime[1]) {
      if (finalHour < dateOrTime[1]) {
      return { code: 400, error: "The tattoo artist finishes work early" };
    }}
  } else {
    if (finalHour < dateOrTime[1]) {
      return { code: 400, error: "The tattoo artist finishes work early" };
    }
  }

  //caso la hora elegida para el turno + la duración calculada supere la hora laboral final, error
  const hourSlice = Number(dateOrTime[1].split(":")[0]);
  const finalHourSlice = Number(finalHour.split(":")[0]);
  const secondFinalHourSlice = Number(secondFinalHour.split(":")[0]) || null;
  if (secondFinalHourSlice && hourSlice + sizesAndDurations[size] > secondFinalHourSlice ) {
  if (hourSlice + sizesAndDurations[size] > finalHourSlice) {
    return { code: 400, error: "The appointment must start earlier" };
  }}

  //caso la hora elegida para el turno + la duración calculada esté dentro del rango laboral, se crea el turno
  if (hourSlice + sizesAndDurations[size] <= finalHourSlice || hourSlice + sizesAndDurations[size] <= secondFinalHourSlice  ) {
    //cálculo del valor de la seña
    const priceRangeFound = await PriceRange.findOne({
      where: { TattooArtistId: tattooArtistId, size: size },
    });
    if (!priceRangeFound) {
      return {
        code: 404,
        error: "Price range not found, the deposit price cannot be calculated",
      };
    }
    const depositAmount = priceRangeFound.priceMin / 2;

    try {
      const appointment = await Appointment.create({
        size,
        image,
        bodyPlace,
        description,
        dateAndTime,
        duration: sizesAndDurations[size],
        depositPrice: depositAmount,
        Customer_Appointment: customerId,
        TattooArtist_Appointment: tattooArtistId,
      });

      return {
        code: 201,
        message: "Appointment created successfully",
        data: appointment,
      };
    } catch (error) {
      return { code: 400, error: "Something went wrong" };
    }
  }
};

module.exports = createAppointment;
