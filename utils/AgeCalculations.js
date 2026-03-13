import moment from "moment";

export function isAgeOverSpecifiedAge(birthDate, ageOver) {
  try {
    // Parse the birth date string using moment
    //const parsedDate = moment(birthDate, "YYYY-MM-DD");
    const parsedDate = moment(birthDate, "MM/DD/YYYY");

    // Calculate age
    const age = moment().diff(parsedDate, "years");

    // Adjust age if birthday hasn't occurred yet this year
    if (moment() < parsedDate.add(age, "years")) {
      age--;
    }

    // Check if the person is ageOver
    return age > ageOver;
  } catch (error) {
    throw error;
  }
}

export function getBirthYear(birthDateString) {
  try {
    // Split the date string by '-'
    const parts = birthDateString.split("/");

    // Extract the year part (index 0)
    const birthYear = parseInt(parts[2]);

    return birthYear;
  } catch (error) {
    throw error;
  }
}

export function calculateAge(birthDateString) {
  try {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // If the current month is less than the birth month or
    // if it's the same month but the current day is before the birth day,
    // then subtract 1 from the age
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  } catch (error) {
    throw error;
  }
}
